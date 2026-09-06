import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  prompt: string;
  color: string;
}

@Component({
  selector: 'app-build-templates',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="head-left">
          <div class="head-badge"><span class="live-dot"></span> Build Mode</div>
          <h1>Templates</h1>
          <p>Start with a ready-made template and customize it with AI</p>
        </div>
      </div>

      <!-- category filter -->
      <div class="categories">
        @for (cat of categories; track cat) {
          <button class="cat-btn" [class.cat-active]="selectedCat === cat" (click)="selectedCat = cat">
            {{ cat }}
          </button>
        }
      </div>

      <!-- templates grid -->
      <div class="templates-grid">
        @for (t of filteredTemplates(); track t.id) {
          <div class="tpl-card" [style.--accent]="t.color" (click)="useTemplate(t)">
            <div class="tpl-emoji">{{ t.emoji }}</div>
            <div class="tpl-cat">{{ t.category }}</div>
            <div class="tpl-name">{{ t.name }}</div>
            <div class="tpl-desc">{{ t.description }}</div>
            <button class="tpl-btn">
              <mat-icon>auto_awesome</mat-icon> Use Template
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }
    .page-head { margin-bottom: 24px; }
    .head-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.25); border-radius: 50px; padding: 4px 13px; font-size: .72rem; font-weight: 600; color: #a78bfa; margin-bottom: 10px; }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4cbe7d; animation: blink 2s ease-in-out infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
    h1 { font-size: clamp(1.4rem,3vw,1.9rem); font-weight: 800; color: var(--text-primary); margin: 0 0 5px; letter-spacing: -.3px; }
    p { color: var(--text-secondary); margin: 0; font-size: .875rem; }
    /* categories */
    .categories { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
    .cat-btn { padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border-color); background: none; color: var(--text-secondary); font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .2s; }
    .cat-btn:hover { border-color: rgba(139,92,246,.3); color: #a78bfa; }
    .cat-btn.cat-active { background: rgba(139,92,246,.2); border-color: rgba(139,92,246,.4); color: #a78bfa; }
    /* grid */
    .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .tpl-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 22px 20px;
      cursor: pointer; transition: border-color .2s, transform .2s, box-shadow .2s;
      display: flex; flex-direction: column; gap: 8px;
    }
    .tpl-card:hover { border-color: var(--accent, rgba(139,92,246,.4)); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,.25); }
    .tpl-emoji { font-size: 2.2rem; }
    .tpl-cat { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--accent, #a78bfa); background: rgba(139,92,246,.1); border-radius: 5px; padding: 2px 8px; width: fit-content; }
    .tpl-name { font-size: .95rem; font-weight: 700; color: var(--text-primary); }
    .tpl-desc { font-size: .78rem; color: var(--text-secondary); line-height: 1.5; flex: 1; }
    .tpl-btn { display: flex; align-items: center; gap: 6px; background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.25); border-radius: 8px; padding: 8px 14px; font-size: .8rem; font-weight: 700; color: #a78bfa; cursor: pointer; margin-top: 4px; transition: all .2s; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .tpl-btn:hover { background: rgba(139,92,246,.3); }
  `],
})
export class BuildTemplatesComponent {
  selectedCat = 'All';

  categories = ['All', 'Landing Page', 'Portfolio', 'Dashboard', 'E-Commerce', 'SaaS', 'Blog', 'App UI'];

  templates: Template[] = [
    { id: '1', name: 'SaaS Landing Page', description: 'Hero + features + pricing + CTA. Perfect for software products.', category: 'Landing Page', emoji: '🚀', color: 'rgba(99,102,241,.4)', prompt: 'Build a modern SaaS landing page with hero section, features grid, pricing table, testimonials, and footer. Dark theme, glassmorphism cards, gradient accents.' },
    { id: '2', name: 'Developer Portfolio', description: 'Showcase your projects, skills, and get hired.', category: 'Portfolio', emoji: '💼', color: 'rgba(20,184,166,.4)', prompt: 'Build a developer portfolio website with hero, about section, skills grid, projects showcase, and contact form. Dark theme with cyan accents and smooth animations.' },
    { id: '3', name: 'Analytics Dashboard', description: 'Stats cards, charts, and data tables.', category: 'Dashboard', emoji: '📊', color: 'rgba(245,158,11,.4)', prompt: 'Build an analytics dashboard with sidebar navigation, stats cards showing key metrics, bar charts, line charts, and a recent activity table. Dark theme.' },
    { id: '4', name: 'E-Commerce Store', description: 'Product grid, filters, cart functionality.', category: 'E-Commerce', emoji: '🛍️', color: 'rgba(236,72,153,.4)', prompt: 'Build an e-commerce product listing page with header, hero banner, product grid with cards, filter sidebar, and footer. Dark luxury theme with gold accents.' },
    { id: '5', name: 'AI Tool Landing', description: 'Modern AI product page with interactive demos.', category: 'SaaS', emoji: '🤖', color: 'rgba(139,92,246,.4)', prompt: 'Build a landing page for an AI tool with animated hero, feature demos, before/after comparisons, social proof, and pricing. Dark theme with purple gradient accents.' },
    { id: '6', name: 'Blog / Magazine', description: 'Featured posts, categories, newsletter.', category: 'Blog', emoji: '✍️', color: 'rgba(34,197,94,.4)', prompt: 'Build a blog/magazine website with sticky header, featured article hero, post cards grid, category filters, sidebar with newsletter signup, and footer.' },
    { id: '7', name: 'Restaurant / Food', description: 'Menu, gallery, reservations — for restaurants.', category: 'Landing Page', emoji: '🍕', color: 'rgba(249,115,22,.4)', prompt: 'Build a restaurant website with navigation, hero with CTA, about section, menu grid, gallery, reservation form, and footer. Warm dark theme with orange accents.' },
    { id: '8', name: 'Mobile App Landing', description: 'App store downloads, screenshots, features.', category: 'Landing Page', emoji: '📱', color: 'rgba(6,182,212,.4)', prompt: 'Build a mobile app landing page with app mockup hero, features list, screenshots carousel, app store download buttons, testimonials, and footer. Dark theme.' },
    { id: '9', name: 'Crypto / Web3', description: 'Token stats, roadmap, whitepaper CTA.', category: 'Landing Page', emoji: '⛓️', color: 'rgba(168,85,247,.4)', prompt: 'Build a crypto/web3 project landing page with animated hero, tokenomics section, roadmap timeline, team grid, and whitepaper CTA. Neon dark theme.' },
    { id: '10', name: 'Admin Panel', description: 'Users, stats, settings — full admin UI.', category: 'Dashboard', emoji: '⚙️', color: 'rgba(99,102,241,.4)', prompt: 'Build an admin panel with sidebar, topbar with search and profile, dashboard with metric cards, users table with actions, and settings page. Dark theme.' },
    { id: '11', name: 'Startup / Agency', description: 'Services, team, portfolio — for agencies.', category: 'SaaS', emoji: '🏢', color: 'rgba(20,184,166,.4)', prompt: 'Build a creative agency website with bold hero, services cards, portfolio grid, team section, client logos, and contact form. Dark minimalist theme.' },
    { id: '12', name: 'Music Player', description: 'Working music player UI with playlist.', category: 'App UI', emoji: '🎵', color: 'rgba(236,72,153,.4)', prompt: 'Build a dark music player app UI with sidebar playlist, album art display, progress bar, playback controls, equalizer animation, and volume control. Full working JS.' },
  ];

  filteredTemplates(): Template[] {
    if (this.selectedCat === 'All') return this.templates;
    return this.templates.filter(t => t.category === this.selectedCat);
  }

  useTemplate(t: Template): void {
    localStorage.setItem('sti_template_prompt', t.prompt);
    window.location.href = '/build';
  }
}
