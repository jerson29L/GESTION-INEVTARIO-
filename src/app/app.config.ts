import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import {
  provideClientHydration,
  withEventReplay
} from '@angular/platform-browser';

import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';

import {
  LucideAngularModule,
  // Navigation & Layout
  Menu, ChevronRight, ChevronDown, ArrowRight, MoreVertical,
  // Actions
  Plus, Save, X, Edit, Trash2, Download, Filter, Search, Eye, EyeOff,
  // Status & Feedback
  CheckCircle, AlertCircle, AlertTriangle, Loader2, TrendingUp,
  // Business Domain
  BookOpen, Package, Users, ShoppingCart, BarChart3, 
  // Commerce & Rating
  Star, Award, Heart, Shield, Truck, Zap,
  // Contact & Location
  Phone, Mail, MapPin,
  // UI Elements
  User, Settings, FolderOpen, Grid3X3, Clock, LogOut, Smile,
  // Categories
  PenTool, Palette, Gamepad2, Gift, ArrowDownCircle
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
  provideClientHydration(withEventReplay()),
  provideHttpClient(withFetch(), withInterceptorsFromDi()),
  // Register the auth interceptor so outgoing HTTP requests include the JWT when available
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    importProvidersFrom(
      LucideAngularModule.pick({
        // Navigation & Layout
        Menu, ChevronRight, ChevronDown, ArrowRight, MoreVertical,
        // Actions
        Plus, Save, X, Edit, Trash2, Download, Filter, Search, Eye, EyeOff,
        // Status & Feedback
        CheckCircle, AlertCircle, AlertTriangle, Loader2, TrendingUp,
        // Business Domain
        BookOpen, Package, Users, ShoppingCart, BarChart3,
        // Commerce & Rating
        Star, Award, Heart, Shield, Truck, Zap,
        // Contact & Location
        Phone, Mail, MapPin,
        // UI Elements
        User, Settings, FolderOpen, Grid3X3, Clock, LogOut, Smile,
        // Categories
        PenTool, Palette, Gamepad2, Gift, ArrowDownCircle
      })
    )
  ]
};
