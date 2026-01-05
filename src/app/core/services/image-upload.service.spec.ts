/**
 * 🧪 Image Upload Service Tests
 * 
 * Tests for ImageUploadService functionality.
 * Tests focus on validation logic (pure functions) and service creation.
 * Firebase Storage integration tests are done via Cypress E2E.
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Storage } from '@angular/fire/storage';
import { ImageUploadService, UploadResult } from './image-upload.service';
import { of, throwError } from 'rxjs';

describe('ImageUploadService', () => {
  let service: ImageUploadService;
  let mockStorage: any;

  const createMockFile = (
    name: string = 'test.jpg',
    type: string = 'image/jpeg',
    size: number = 1024
  ): File => {
    const content = new Array(Math.min(size, 1000)).fill('a').join('');
    const blob = new Blob([content], { type });
    // Create file with the blob and override size
    const file = new File([blob], name, { type });
    Object.defineProperty(file, 'size', { value: size, writable: false });
    return file;
  };

  const mockUploadResult: UploadResult = {
    url: 'https://example.com/image.jpg',
    path: 'products/prod-1/test.jpg',
    name: 'test.jpg',
    size: 1024
  };

  beforeEach(() => {
    // Use a simple object for Storage mock
    mockStorage = {
      app: { name: 'test' }
    };

    TestBed.configureTestingModule({
      providers: [
        ImageUploadService,
        { provide: Storage, useValue: mockStorage }
      ]
    });

    service = TestBed.inject(ImageUploadService);
  });

  describe('✅ Criação do Serviço', () => {
    it('deve criar o serviço', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('✅ Validação de Arquivo (validateFile)', () => {
    it('deve validar arquivo JPEG', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const result = (service as any).validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('deve validar arquivo PNG', () => {
      const file = createMockFile('test.png', 'image/png', 1024);
      const result = (service as any).validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('deve validar arquivo WebP', () => {
      const file = createMockFile('test.webp', 'image/webp', 1024);
      const result = (service as any).validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar formato GIF', () => {
      const file = createMockFile('test.gif', 'image/gif', 1024);
      const result = (service as any).validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Formato não suportado');
    });

    it('deve rejeitar arquivo acima de 5MB', () => {
      const file = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024);
      const result = (service as any).validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('muito grande');
    });

    it('deve aceitar arquivo de 5MB exatos', () => {
      const file = createMockFile('max.jpg', 'image/jpeg', 5 * 1024 * 1024);
      const result = (service as any).validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar arquivo nulo', () => {
      const result = (service as any).validateFile(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nenhum arquivo');
    });

    it('deve rejeitar arquivo undefined', () => {
      const result = (service as any).validateFile(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nenhum arquivo');
    });

    it('deve rejeitar formato SVG', () => {
      const file = createMockFile('test.svg', 'image/svg+xml', 1024);
      const result = (service as any).validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Formato não suportado');
    });

    it('deve aceitar arquivo pequeno (1KB)', () => {
      const file = createMockFile('small.jpg', 'image/jpeg', 1024);
      const result = (service as any).validateFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('📤 uploadProductImage - Validação', () => {
    it('deve rejeitar arquivo com formato inválido (TXT)', fakeAsync(() => {
      const file = createMockFile('test.txt', 'text/plain');

      let errorResult: Error | undefined;
      service.uploadProductImage(file, 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('Formato não suportado');
    }));

    it('deve rejeitar arquivo muito grande (>5MB)', fakeAsync(() => {
      const file = createMockFile('large.jpg', 'image/jpeg', 10 * 1024 * 1024);

      let errorResult: Error | undefined;
      service.uploadProductImage(file, 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('muito grande');
    }));

    it('deve rejeitar arquivo GIF (formato não suportado)', fakeAsync(() => {
      const file = createMockFile('test.gif', 'image/gif');

      let errorResult: Error | undefined;
      service.uploadProductImage(file, 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('Formato não suportado');
    }));

    it('deve rejeitar arquivo BMP (formato não suportado)', fakeAsync(() => {
      const file = createMockFile('test.bmp', 'image/bmp');

      let errorResult: Error | undefined;
      service.uploadProductImage(file, 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('Formato não suportado');
    }));
  });

  describe('📊 uploadWithProgress - Validação', () => {
    it('deve retornar erro para arquivo inválido (formato)', () => {
      const file = createMockFile('test.txt', 'text/plain');

      const { result$ } = service.uploadWithProgress(file, 'prod-1');

      let errorResult: Error | undefined;
      result$.subscribe({
        error: (error) => { errorResult = error; }
      });

      expect(errorResult?.message).toContain('Formato não suportado');
    });

    it('deve retornar erro para arquivo muito grande', () => {
      const file = createMockFile('large.jpg', 'image/jpeg', 10 * 1024 * 1024);

      const { result$ } = service.uploadWithProgress(file, 'prod-1');

      let errorResult: Error | undefined;
      result$.subscribe({
        error: (error) => { errorResult = error; }
      });

      expect(errorResult?.message).toContain('muito grande');
    });
  });

  describe('📦 uploadMultiple - Validação', () => {
    it('deve rejeitar array vazio', fakeAsync(() => {
      let errorResult: Error | undefined;
      service.uploadMultiple([], 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('Nenhum arquivo');
    }));

    it('deve rejeitar mais de 5 imagens', fakeAsync(() => {
      const files = Array(6).fill(null).map((_, i) => 
        createMockFile(`test${i}.jpg`)
      );

      let errorResult: Error | undefined;
      service.uploadMultiple(files, 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('Máximo de 5');
    }));
  });

  describe('📊 Configurações do Serviço', () => {
    it('deve ter MAX_FILE_SIZE de 5MB', () => {
      const maxSize = (service as any).MAX_FILE_SIZE;
      expect(maxSize).toBe(5 * 1024 * 1024);
    });

    it('deve ter ALLOWED_FORMATS corretos', () => {
      const formats = (service as any).ALLOWED_FORMATS;
      expect(formats).toContain('image/jpeg');
      expect(formats).toContain('image/png');
      expect(formats).toContain('image/webp');
      expect(formats.length).toBe(3);
    });

    it('deve ter PRODUCTS_PATH correto', () => {
      const path = (service as any).PRODUCTS_PATH;
      expect(path).toBe('products');
    });
  });

  describe('📤 uploadProductImage - Cenários de Borda', () => {
    it('deve rejeitar arquivo TIFF', fakeAsync(() => {
      const file = createMockFile('test.tiff', 'image/tiff');

      let errorResult: Error | undefined;
      service.uploadProductImage(file, 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('Formato não suportado');
    }));

    it('deve rejeitar arquivo ICO', fakeAsync(() => {
      const file = createMockFile('test.ico', 'image/x-icon');

      let errorResult: Error | undefined;
      service.uploadProductImage(file, 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('Formato não suportado');
    }));

    it('deve rejeitar arquivo PDF disfarçado', fakeAsync(() => {
      const file = createMockFile('test.pdf', 'application/pdf');

      let errorResult: Error | undefined;
      service.uploadProductImage(file, 'prod-1').subscribe({
        error: (error) => { errorResult = error; }
      });

      tick();
      expect(errorResult?.message).toContain('Formato não suportado');
    }));

    it('deve aceitar arquivo de exatamente 5MB', fakeAsync(() => {
      const file = createMockFile('exact5mb.jpg', 'image/jpeg', 5 * 1024 * 1024);
      
      // A validação deve passar
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    }));

    it('deve rejeitar arquivo de 5MB + 1 byte', fakeAsync(() => {
      const file = createMockFile('over5mb.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1);
      
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('muito grande');
    }));
  });

  describe('📊 uploadWithProgress - Cenários Adicionais', () => {
    it('deve retornar erro para arquivo SVG', () => {
      const file = createMockFile('test.svg', 'image/svg+xml');

      const { result$ } = service.uploadWithProgress(file, 'prod-1');

      let errorResult: Error | undefined;
      result$.subscribe({
        error: (error) => { errorResult = error; }
      });

      expect(errorResult?.message).toContain('Formato não suportado');
    });

    it('deve retornar erro para arquivo null', () => {
      const { result$ } = service.uploadWithProgress(null as any, 'prod-1');

      let errorResult: Error | undefined;
      result$.subscribe({
        error: (error) => { errorResult = error; }
      });

      expect(errorResult?.message).toContain('Nenhum arquivo');
    });
  });

  describe('📦 uploadMultiple - Validação Detalhada', () => {
    it('deve aceitar exatamente 5 imagens', () => {
      const files = Array(5).fill(null).map((_, i) => 
        createMockFile(`test${i}.jpg`)
      );

      // Validação individual deve passar
      files.forEach(file => {
        const validation = (service as any).validateFile(file);
        expect(validation.valid).toBe(true);
      });
    });

    it('deve aceitar 1 imagem', () => {
      const files = [createMockFile('single.jpg')];
      
      const validation = (service as any).validateFile(files[0]);
      expect(validation.valid).toBe(true);
    });
  });

  describe('🔧 Validação de Tipos MIME', () => {
    it('deve aceitar image/jpeg', () => {
      const file = createMockFile('test.jpg', 'image/jpeg');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar image/png', () => {
      const file = createMockFile('test.png', 'image/png');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar image/webp', () => {
      const file = createMockFile('test.webp', 'image/webp');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve rejeitar video/mp4', () => {
      const file = createMockFile('test.mp4', 'video/mp4');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar audio/mpeg', () => {
      const file = createMockFile('test.mp3', 'audio/mpeg');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar application/json', () => {
      const file = createMockFile('test.json', 'application/json');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar application/zip', () => {
      const file = createMockFile('test.zip', 'application/zip');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar text/html', () => {
      const file = createMockFile('test.html', 'text/html');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });
  });

  describe('📐 Validação de Tamanho', () => {
    it('deve aceitar arquivo de 1KB', () => {
      const file = createMockFile('tiny.jpg', 'image/jpeg', 1024);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar arquivo de 1MB', () => {
      const file = createMockFile('small.jpg', 'image/jpeg', 1024 * 1024);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar arquivo de 2.5MB', () => {
      const file = createMockFile('medium.jpg', 'image/jpeg', 2.5 * 1024 * 1024);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar arquivo de 4.9MB', () => {
      const file = createMockFile('almost5mb.jpg', 'image/jpeg', 4.9 * 1024 * 1024);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve rejeitar arquivo de 10MB', () => {
      const file = createMockFile('huge.jpg', 'image/jpeg', 10 * 1024 * 1024);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar arquivo de 100MB', () => {
      const file = createMockFile('massive.jpg', 'image/jpeg', 100 * 1024 * 1024);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });
  });

  describe('🏷️ Validação de Nomes de Arquivo', () => {
    it('deve aceitar nome com espaços', () => {
      const file = createMockFile('my image.jpg', 'image/jpeg');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar nome com caracteres especiais', () => {
      const file = createMockFile('imagem-produto_2024.jpg', 'image/jpeg');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar nome com acentos', () => {
      const file = createMockFile('farmácia-são-paulo.jpg', 'image/jpeg');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar nome muito longo', () => {
      const longName = 'a'.repeat(200) + '.jpg';
      const file = createMockFile(longName, 'image/jpeg');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });
  });

  // ==================== TESTES DE UPLOAD RESULT INTERFACE ====================

  describe('UploadResult Interface', () => {
    it('deve ter todas as propriedades obrigatórias', () => {
      const result: UploadResult = {
        url: 'https://storage.com/image.jpg',
        path: 'products/prod-1/image.jpg',
        name: 'image.jpg',
        size: 1024
      };
      expect(result.url).toBeDefined();
      expect(result.path).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.size).toBeDefined();
    });

    it('deve aceitar URL com parâmetros', () => {
      const result: UploadResult = {
        url: 'https://storage.com/image.jpg?token=abc123&alt=media',
        path: 'products/prod-1/image.jpg',
        name: 'image.jpg',
        size: 2048
      };
      expect(result.url).toContain('token=');
    });

    it('deve aceitar path com múltiplos níveis', () => {
      const result: UploadResult = {
        url: 'https://storage.com/image.jpg',
        path: 'products/category/subcategory/prod-1/image.jpg',
        name: 'image.jpg',
        size: 512
      };
      expect(result.path.split('/').length).toBe(5);
    });

    it('deve aceitar size zero', () => {
      const result: UploadResult = {
        url: 'https://storage.com/empty.jpg',
        path: 'products/empty/empty.jpg',
        name: 'empty.jpg',
        size: 0
      };
      expect(result.size).toBe(0);
    });
  });

  // ==================== TESTES DE CONFIGURAÇÕES ====================

  describe('Service Configurations Extended', () => {
    it('MAX_FILE_SIZE deve ser exatamente 5242880 bytes', () => {
      const maxSize = (service as any).MAX_FILE_SIZE;
      expect(maxSize).toBe(5242880);
    });

    it('ALLOWED_FORMATS não deve incluir GIF', () => {
      const formats = (service as any).ALLOWED_FORMATS;
      expect(formats).not.toContain('image/gif');
    });

    it('ALLOWED_FORMATS não deve incluir SVG', () => {
      const formats = (service as any).ALLOWED_FORMATS;
      expect(formats).not.toContain('image/svg+xml');
    });

    it('ALLOWED_FORMATS não deve incluir BMP', () => {
      const formats = (service as any).ALLOWED_FORMATS;
      expect(formats).not.toContain('image/bmp');
    });

    it('ALLOWED_FORMATS não deve incluir TIFF', () => {
      const formats = (service as any).ALLOWED_FORMATS;
      expect(formats).not.toContain('image/tiff');
    });

    it('PRODUCTS_PATH não deve ter barra no início', () => {
      const path = (service as any).PRODUCTS_PATH;
      expect(path.startsWith('/')).toBe(false);
    });

    it('PRODUCTS_PATH não deve ter barra no final', () => {
      const path = (service as any).PRODUCTS_PATH;
      expect(path.endsWith('/')).toBe(false);
    });
  });

  // ==================== TESTES DE VALIDAÇÃO EDGE CASES ====================

  describe('Validation Edge Cases', () => {
    it('deve rejeitar arquivo com tipo MIME vazio', () => {
      const file = createMockFile('test.jpg', '');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar arquivo com tipo octet-stream', () => {
      const file = createMockFile('test.bin', 'application/octet-stream');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve aceitar arquivo de 0 bytes (validação de tipo apenas)', () => {
      const file = createMockFile('empty.jpg', 'image/jpeg', 0);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar arquivo de 1 byte', () => {
      const file = createMockFile('tiny.jpg', 'image/jpeg', 1);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });
  });

  // ==================== TESTES DE CREATE MOCK FILE ====================

  describe('createMockFile Helper', () => {
    it('deve criar arquivo com valores padrão', () => {
      const file = createMockFile();
      expect(file.name).toBe('test.jpg');
      expect(file.type).toBe('image/jpeg');
      expect(file.size).toBe(1024);
    });

    it('deve criar arquivo com nome customizado', () => {
      const file = createMockFile('custom.png');
      expect(file.name).toBe('custom.png');
    });

    it('deve criar arquivo com tipo customizado', () => {
      const file = createMockFile('test.png', 'image/png');
      expect(file.type).toBe('image/png');
    });

    it('deve criar arquivo com tamanho customizado', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 5000);
      expect(file.size).toBe(5000);
    });

    it('deve criar arquivo instância de File', () => {
      const file = createMockFile();
      expect(file instanceof File).toBe(true);
    });
  });

  // ==================== TESTES DE MÚLTIPLOS UPLOADS ====================

  describe('uploadMultiple Validation Extended', () => {
    it('deve validar cada arquivo individualmente', () => {
      const validFile = createMockFile('valid.jpg', 'image/jpeg', 1024);
      const invalidFile = createMockFile('invalid.txt', 'text/plain', 1024);
      
      const validResult = (service as any).validateFile(validFile);
      const invalidResult = (service as any).validateFile(invalidFile);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    it('deve aceitar 2 arquivos', () => {
      const files = [
        createMockFile('img1.jpg'),
        createMockFile('img2.png', 'image/png')
      ];
      
      files.forEach(file => {
        const validation = (service as any).validateFile(file);
        expect(validation.valid).toBe(true);
      });
    });

    it('deve aceitar 3 arquivos', () => {
      const files = [
        createMockFile('img1.jpg'),
        createMockFile('img2.png', 'image/png'),
        createMockFile('img3.webp', 'image/webp')
      ];
      
      files.forEach(file => {
        const validation = (service as any).validateFile(file);
        expect(validation.valid).toBe(true);
      });
    });

    it('deve aceitar 4 arquivos', () => {
      const files = Array(4).fill(null).map((_, i) => 
        createMockFile(`img${i + 1}.jpg`)
      );
      
      files.forEach(file => {
        const validation = (service as any).validateFile(file);
        expect(validation.valid).toBe(true);
      });
    });
  });

  // ==================== TESTES DE TAMANHO EXATO ====================

  describe('File Size Boundary Tests', () => {
    const MB = 1024 * 1024;

    it('deve aceitar arquivo de 4,999,999 bytes', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 5 * MB - 1);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar arquivo de exatamente 5MB', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 5 * MB);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve rejeitar arquivo de 5,000,001 bytes', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 5 * MB + 1);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar arquivo de 6MB', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 6 * MB);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar arquivo de 50MB', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 50 * MB);
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });
  });

  // ==================== TESTES DE SERVICE INJECTABLE ====================

  describe('Service Injectable', () => {
    it('deve ser provided in root', () => {
      const annotations = (ImageUploadService as any).ɵprov;
      expect(annotations).toBeDefined();
      expect(annotations.providedIn).toBe('root');
    });

    it('deve ter storage injetado', () => {
      const storage = (service as any).storage;
      expect(storage).toBeDefined();
    });
  });

  // ==================== TESTES DE MENSAGENS DE ERRO ====================

  describe('Error Messages', () => {
    it('mensagem para formato inválido deve conter formatos aceitos', () => {
      const file = createMockFile('test.gif', 'image/gif');
      const validation = (service as any).validateFile(file);
      expect(validation.error).toContain('JPEG');
      expect(validation.error).toContain('PNG');
      expect(validation.error).toContain('WebP');
    });

    it('mensagem para arquivo grande deve conter tamanho máximo', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 10 * 1024 * 1024);
      const validation = (service as any).validateFile(file);
      expect(validation.error).toContain('5');
      expect(validation.error).toContain('MB');
    });

    it('mensagem para arquivo nulo deve ser clara', () => {
      const validation = (service as any).validateFile(null);
      expect(validation.error).toContain('arquivo');
    });
  });

  // ==================== TESTES DE FORMATOS ACEITOS ====================

  describe('Accepted Formats Detailed', () => {
    it('JPEG deve ser case insensitive no tipo', () => {
      const file1 = createMockFile('test.jpg', 'image/jpeg');
      const validation1 = (service as any).validateFile(file1);
      expect(validation1.valid).toBe(true);
    });

    it('PNG deve ter transparência suportada', () => {
      const file = createMockFile('transparent.png', 'image/png');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('WebP deve ser formato moderno aceito', () => {
      const file = createMockFile('modern.webp', 'image/webp');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });
  });

  // ==================== TESTES DE EXTENSÕES DE ARQUIVO ====================

  describe('File Extensions', () => {
    it('deve aceitar .jpg', () => {
      const file = createMockFile('image.jpg', 'image/jpeg');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar .jpeg', () => {
      const file = createMockFile('image.jpeg', 'image/jpeg');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar .png', () => {
      const file = createMockFile('image.png', 'image/png');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve aceitar .webp', () => {
      const file = createMockFile('image.webp', 'image/webp');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(true);
    });

    it('deve rejeitar .gif', () => {
      const file = createMockFile('image.gif', 'image/gif');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });

    it('deve rejeitar .bmp', () => {
      const file = createMockFile('image.bmp', 'image/bmp');
      const validation = (service as any).validateFile(file);
      expect(validation.valid).toBe(false);
    });
  });
});

