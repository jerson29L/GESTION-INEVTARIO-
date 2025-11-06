import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Categorias } from './categorias';
import { RouterTestingModule } from '@angular/router/testing';
import { LucideAngularModule } from 'lucide-angular';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  X,
  Save,
  BookOpen,
  PenTool,
  Palette,
  Gamepad2,
  Gift
} from 'lucide-angular';

describe('Categorias', () => {
  let component: Categorias;
  let fixture: ComponentFixture<Categorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Categorias,
        RouterTestingModule,
        LucideAngularModule.pick({
          Plus,
          Search,
          ChevronDown,
          ChevronRight,
          Edit,
          Trash2,
          X,
          Save,
          BookOpen,
          PenTool,
          Palette,
          Gamepad2,
          Gift
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Categorias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
