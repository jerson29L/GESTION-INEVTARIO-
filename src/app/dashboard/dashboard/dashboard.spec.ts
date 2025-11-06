import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardComponent } from './dashboard';
import { provideRouter } from '@angular/router';
import { LucideAngularModule,Calendar, Bell, Plus, TrendingUp, DollarSign, Package, TrendingDown, AlertTriangle, Users, Search, Filter, Star, Activity, Eye, Edit, Trash2, Download, BookOpen, PenTool, Palette, BarChart3, Target } from 'lucide-angular';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent,LucideAngularModule.pick({ Calendar, Bell, Plus, TrendingUp, DollarSign, Package, TrendingDown, AlertTriangle, Users, Search, Filter, Star, Activity, Eye, Edit, Trash2, Download, BookOpen, PenTool, Palette, BarChart3, Target })],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
