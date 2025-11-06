import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule, BookOpen, BarChart3, Package, ShoppingCart, Users, FolderOpen, Settings, MoreVertical, Smile, Clock, ArrowDownCircle, AlertTriangle, LogOut } from 'lucide-angular';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Layout } from './layout';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout,LucideAngularModule.pick({ BookOpen ,BarChart3,
          Package,
          ShoppingCart,
          Users,
          FolderOpen,
          Settings,
          MoreVertical,
          Smile,
          Clock,
          ArrowDownCircle,
          AlertTriangle,
          LogOut}),],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
