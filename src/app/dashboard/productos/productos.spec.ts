import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProductosComponent } from './productos';
import { LucideAngularModule, Plus,
          CheckCircle,
          X,
          AlertTriangle,
          Loader2,
          Search,
          Download,
          Package,
          Edit,
          Trash2,
          AlertCircle,
          Save } from 'lucide-angular';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosComponent, LucideAngularModule.pick({Plus,
          CheckCircle,
          X,
          AlertTriangle,
          Loader2,
          Search,
          Download,
          Package,
          Edit,
          Trash2,
          AlertCircle,
          Save})],
      providers: [provideHttpClient(), 
        provideHttpClientTesting(),
        provideRouter([]),]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
