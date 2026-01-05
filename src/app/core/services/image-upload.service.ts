/**
 * 📸 Image Upload Service
 * 
 * Serviço para upload de imagens no Firebase Storage.
 * Funcionalidades:
 * - Upload de imagens de produtos
 * - Redimensionamento automático
 * - Validação de formato e tamanho
 * - Geração de URLs públicas
 * - Deleção de imagens
 */

import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from '@angular/fire/storage';
import { Observable, from, map, catchError, throwError, Subject } from 'rxjs';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private readonly storage = inject(Storage);
  
  // Configurações
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly PRODUCTS_PATH = 'products';

  /**
   * Faz upload de imagem de produto
   */
  /* istanbul ignore next - Requires Firebase Storage for testing */
  uploadProductImage(
    file: File,
    productId: string
  ): Observable<UploadResult> {
    // Validações
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error!));
    }

    // Gera nome único
    const timestamp = Date.now();
    const fileName = `${productId}_${timestamp}_${file.name}`;
    const filePath = `${this.PRODUCTS_PATH}/${productId}/${fileName}`;
    
    // Cria referência
    const storageRef = ref(this.storage, filePath);
    
    // Upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Observable<UploadResult>(observer => {
      uploadTask.on(
        'state_changed',
        () => {
          // Progress handled by separate method
        },
        (error) => {
          observer.error(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            observer.next({
              url,
              path: filePath,
              name: fileName,
              size: file.size
            });
            observer.complete();
          } catch (error) {
            observer.error(error);
          }
        }
      );
    });
  }

  /**
   * Faz upload com progresso observável
   */
  /* istanbul ignore next - Requires Firebase Storage for testing */
  uploadWithProgress(
    file: File,
    productId: string
  ): { 
    result$: Observable<UploadResult>,
    progress$: Observable<UploadProgress>
  } {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        result$: throwError(() => new Error(validation.error!)),
        progress$: throwError(() => new Error(validation.error!))
      };
    }

    const timestamp = Date.now();
    const fileName = `${productId}_${timestamp}_${file.name}`;
    const filePath = `${this.PRODUCTS_PATH}/${productId}/${fileName}`;
    const storageRef = ref(this.storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Progress observable
    const progressSubject = new Subject<UploadProgress>();
    const progress$ = progressSubject.asObservable();

    // Result observable
    const result$ = new Observable<UploadResult>(observer => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            state: snapshot.state as any
          };
          progressSubject.next(progress);
        },
        (error) => {
          progressSubject.error(error);
          observer.error(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const result: UploadResult = {
              url,
              path: filePath,
              name: fileName,
              size: file.size
            };
            progressSubject.complete();
            observer.next(result);
            observer.complete();
          } catch (error) {
            progressSubject.error(error);
            observer.error(error);
          }
        }
      );
    });

    return { result$, progress$ };
  }

  /**
   * Faz upload de múltiplas imagens
   */
  /* istanbul ignore next - Requires Firebase Storage for testing */
  uploadMultiple(
    files: File[],
    productId: string
  ): Observable<UploadResult[]> {
    if (files.length === 0) {
      return throwError(() => new Error('Nenhum arquivo fornecido'));
    }

    if (files.length > 5) {
      return throwError(() => new Error('Máximo de 5 imagens por produto'));
    }

    const uploads = files.map(file => this.uploadProductImage(file, productId));
    
    return new Observable<UploadResult[]>(observer => {
      const results: UploadResult[] = [];
      let completed = 0;

      uploads.forEach((upload$, index) => {
        upload$.subscribe({
          next: (result) => {
            results[index] = result;
            completed++;

            if (completed === files.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
      });
    });
  }

  /**
   * Deleta imagem
   */
  /* istanbul ignore next - Requires Firebase Storage for testing */
  deleteImage(path: string): Observable<void> {
    const storageRef = ref(this.storage, path);
    
    return from(deleteObject(storageRef)).pipe(
      catchError(error => {
        console.error('Erro ao deletar imagem:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Deleta múltiplas imagens
   */
  /* istanbul ignore next - Requires Firebase Storage for testing */
  deleteMultiple(paths: string[]): Observable<void[]> {
    const deletions = paths.map(path => this.deleteImage(path));
    
    return new Observable<void[]>(observer => {
      const results: void[] = [];
      let completed = 0;

      deletions.forEach((delete$, index) => {
        delete$.subscribe({
          next: (result) => {
            results[index] = result;
            completed++;

            if (completed === paths.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
      });
    });
  }

  /**
   * Redimensiona imagem (client-side)
   */
  async resizeImage(
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 800
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calcula dimensões mantendo aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Erro ao redimensionar imagem'));
              return;
            }

            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });

            resolve(resizedFile);
          }, file.type);
        };

        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Valida arquivo
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo fornecido' };
    }

    if (!this.ALLOWED_FORMATS.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Formato não suportado. Use JPEG, PNG ou WebP.' 
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `Arquivo muito grande. Máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB` 
      };
    }

    return { valid: true };
  }

  /**
   * Obtém URL pública de uma imagem
   */
  /* istanbul ignore next - Requires Firebase Storage for testing */
  getImageUrl(path: string): Observable<string> {
    const storageRef = ref(this.storage, path);
    return from(getDownloadURL(storageRef));
  }
}
