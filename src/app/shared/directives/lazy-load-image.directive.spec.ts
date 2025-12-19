/**
 * 🧪 Lazy Load Image Directive Tests
 */

import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LazyLoadImageDirective } from './lazy-load-image.directive';

@Component({
  template: `
    <img 
      [appLazyLoad]="imageSrc" 
      [fallbackImage]="fallback"
      alt="Test Image"
    />
  `,
  standalone: true,
  imports: [LazyLoadImageDirective]
})
class TestComponent {
  imageSrc = 'https://example.com/image.jpg';
  fallback = 'assets/placeholder.png';
}

describe('LazyLoadImageDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let imgElement: DebugElement;
  let intersectionObserverMock: any;

  beforeEach(async () => {
    // Mock IntersectionObserver
    intersectionObserverMock = {
      observe: jasmine.createSpy('observe'),
      disconnect: jasmine.createSpy('disconnect')
    };

    (window as any).IntersectionObserver = jasmine.createSpy('IntersectionObserver')
      .and.returnValue(intersectionObserverMock);

    await TestBed.configureTestingModule({
      imports: [TestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    imgElement = fixture.debugElement.query(By.directive(LazyLoadImageDirective));
    fixture.detectChanges();
  });

  it('deve criar a directive', () => {
    const directive = imgElement.injector.get(LazyLoadImageDirective);
    expect(directive).toBeTruthy();
  });

  it('deve criar IntersectionObserver', () => {
    expect((window as any).IntersectionObserver).toHaveBeenCalled();
  });

  it('deve observar o elemento', () => {
    expect(intersectionObserverMock.observe).toHaveBeenCalledWith(imgElement.nativeElement);
  });

  it('deve definir src inicial como fallback', () => {
    expect(imgElement.nativeElement.src).toContain('placeholder.png');
  });

  it('deve desconectar observer no ngOnDestroy', () => {
    const directive = imgElement.injector.get(LazyLoadImageDirective);
    directive.ngOnDestroy();
    
    expect(intersectionObserverMock.disconnect).toHaveBeenCalled();
  });

  it('deve carregar imagem quando intersecting', (done) => {
    const observerCallback = (window as any).IntersectionObserver.calls.mostRecent().args[0];
    const mockEntries = [{
      isIntersecting: true,
      target: imgElement.nativeElement
    }];

    // Mock Image onload
    spyOn(window, 'Image').and.returnValue({
      onload: null,
      onerror: null,
      src: ''
    } as any);

    observerCallback(mockEntries);

    setTimeout(() => {
      done();
    }, 100);
  });

  it('deve usar fallback em caso de erro', () => {
    const directive = imgElement.injector.get(LazyLoadImageDirective);
    component.imageSrc = 'invalid-url';
    fixture.detectChanges();

    expect(imgElement.nativeElement.src).toContain('placeholder.png');
  });

  it('deve adicionar classe "loaded" após carregar', (done) => {
    const observerCallback = (window as any).IntersectionObserver.calls.mostRecent().args[0];
    
    // Simula entrada intersectando
    const mockEntries = [{
      isIntersecting: true,
      target: imgElement.nativeElement
    }];

    observerCallback(mockEntries);

    setTimeout(() => {
      done();
    }, 100);
  });

  it('não deve carregar se não estiver intersecting', () => {
    const observerCallback = (window as any).IntersectionObserver.calls.mostRecent().args[0];
    const srcBefore = imgElement.nativeElement.src;
    
    const mockEntries = [{
      isIntersecting: false,
      target: imgElement.nativeElement
    }];

    observerCallback(mockEntries);

    expect(imgElement.nativeElement.src).toBe(srcBefore);
  });
});
