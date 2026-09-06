import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, HostListener, NgZone
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('howSection')          howRef!: ElementRef;
  @ViewChild('featuresSection')     featuresRef!: ElementRef;
  @ViewChild('journeySection')      journeyRef!: ElementRef;
  @ViewChild('aiSection')           aiRef!: ElementRef;
  @ViewChild('statsSection')        statsRef!: ElementRef;
  @ViewChild('testimonialsSection') testimonialsRef!: ElementRef;
  @ViewChild('ctaSection')          ctaRef!: ElementRef;

  scrolled            = false;
  heroVisible         = false;
  howVisible          = false;
  featuresVisible     = false;
  journeyVisible      = false;
  aiVisible           = false;
  statsVisible        = false;
  testimonialsVisible = false;
  ctaVisible          = false;

  // ── Dashboard preview loop state ────────────────────────
  dashStep   = 0;   // 0=idle 1=ring 2=bars 3=task1 4=task2 5=task3 6=toast 7=reset
  dashCount  = 0;   // ring % counter
  dashIncome = 0;   // income number counter
  private dashTimers: ReturnType<typeof setTimeout>[] = [];

  // ── How It Works loop state ─────────────────────────────
  howStep = 0;           // 0–4, drives active highlight
  private howTimers: ReturnType<typeof setTimeout>[] = [];

  // Steps: 0=none, 1=msg1, 2=typing1, 3=msg2, 4=msg3, 5=typing2, 6=msg4, 7=pause then reset
  chatStep   = 0;
  chatReset  = false;   // true briefly during wipe so CSS can re-trigger animations

  private chatTimers: ReturnType<typeof setTimeout>[] = [];
  private observer!: IntersectionObserver;

  // ── Static data ──────────────────────────────────────────
  particles = Array.from({ length: 24 }, () => ({
    style: `width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;`
          +`left:${Math.random()*100}%;top:${Math.random()*100}%;`
          +`animation-delay:${Math.random()*10}s;`
          +`animation-duration:${Math.random()*12+10}s;`
          +`opacity:${Math.random()*0.3+0.05};`
  }));

  incomeBars = [
    { h:'28%', label:'M1', delay:'0.2s' },
    { h:'44%', label:'M2', delay:'0.3s' },
    { h:'55%', label:'M3', delay:'0.4s' },
    { h:'72%', label:'M4', delay:'0.5s' },
    { h:'68%', label:'M5', delay:'0.6s' },
    { h:'92%', label:'M6', delay:'0.7s' },
  ];

  roadmapSteps = [
    { title:'HTML & CSS Basics',    done:true,  active:false },
    { title:'JavaScript Core',      done:true,  active:false },
    { title:'React Framework',      done:false, active:true  },
    { title:'First Portfolio Site', done:false, active:false },
  ];

  avatarColors = ['#00668c','#3b3c3d','#71c4ef','#005a7a','#2a2b2c'];

  howSteps = [
    { num:'01', title:'Assess Your Skills',  desc:'Add skills, levels and goals. AI maps your current position.',           items:['Skill levels','Experience years','Career goals'],          delay:'0s'    },
    { num:'02', title:'AI Analyzes Market',  desc:'Real-time scanning to score demand, salary and suitability.',            items:['Market demand score','Career suitability %','Gap analysis'],delay:'0.12s' },
    { num:'03', title:'Get Your Roadmap',    desc:'Receive a personalised AI step-by-step learning plan.',                  items:['30/60/90-day plans','Daily tasks','Weekly milestones'],    delay:'0.24s' },
    { num:'04', title:'Start Earning',       desc:'Launch your freelance profile with AI-generated gig titles.',            items:['Gig ideas','Portfolio score','Income tracking'],            delay:'0.36s' },
  ];

  featureCards = [
    { title:'AI Career Analysis',    desc:'Ranked career paths scored by market demand, salary and skill match.',         delay:'0s',    tag:'GPT-4'         },
    { title:'Personalized Roadmaps', desc:'30/60/90-day plans with daily tasks, curated resources and milestones.',       delay:'0.08s', tag:'Daily AI'      },
    { title:'Income Prediction',     desc:'Monthly freelance and annual salary projections before you even start.',        delay:'0.16s', tag:'Forecast'      },
    { title:'Freelance Finder',      desc:'Fiverr niches, Upwork categories and ready-made gig titles for your skills.',  delay:'0.24s', tag:'Fiverr/Upwork' },
    { title:'Progress Tracker',      desc:'Daily logging, streaks, achievement badges and analytics charts.',              delay:'0.32s', tag:'Streaks'       },
    { title:'Portfolio Analyzer',    desc:'AI quality score, resume readiness rating and improvement list.',               delay:'0.40s', tag:'AI Review'     },
    { title:'AI Mentor Chat',        desc:'24/7 context-aware mentor that knows your profile and answers instantly.',      delay:'0.48s', tag:'24/7'          },
    { title:'Skill Assessment',      desc:'Multi-step evaluation with gap analysis and market relevance scoring.',         delay:'0.56s', tag:'Smart'         },
    { title:'Admin Dashboard',       desc:'Full user management, analytics and AI prompt configuration panel.',            delay:'0.64s', tag:'Admin'         },
  ];

  journey = [
    { week:'Week 1–2',  title:'Foundation Setup',  desc:'AI assesses skills and builds your personalized learning base.',   outcome:'Clear 90-day plan ready',  delay:'0s'    },
    { week:'Week 3–4',  title:'Core Skills Sprint', desc:'Daily AI-guided sessions with curated resources and projects.',   outcome:'2 projects completed',     delay:'0.12s' },
    { week:'Month 2',   title:'Portfolio Building', desc:'AI scores and optimises your portfolio for recruiter appeal.',    outcome:'Portfolio score 85/100',   delay:'0.24s' },
    { week:'Month 3',   title:'First Income',       desc:'Launch on Fiverr/Upwork with AI-generated gig titles.',          outcome:'First $200 earned',        delay:'0.36s' },
    { week:'Month 4–6', title:'Scale & Grow',       desc:'AI tracks growth and adjusts strategy for maximum scaling.',     outcome:'$1,500+ / month income',   delay:'0.48s' },
  ];

  aiCards = [
    { title:'Market Demand',    value:'Frontend Dev · High',   pct:'87', delay:'0s'   },
    { title:'Income Potential', value:'$2,500 – $8,000 / mo', pct:'74', delay:'0.1s' },
    { title:'Skill Match',      value:'React · 78% ready',     pct:'78', delay:'0.2s' },
    { title:'Time to Income',   value:'45 days estimated',      pct:'60', delay:'0.3s' },
  ];

  stats = [
    { value:'10,000+', label:'Active Students',    desc:'Learning every day',        delay:'0s'   },
    { value:'50+',     label:'Career Paths',        desc:'AI-analyzed and ranked',    delay:'0.1s' },
    { value:'$2.4M',   label:'Earned by Students',  desc:'Total freelance income',    delay:'0.2s' },
    { value:'45 days', label:'Avg. First Income',   desc:'Signup to first dollar',    delay:'0.3s' },
    { value:'95%',     label:'Success Rate',         desc:'Students hit their goals',  delay:'0.4s' },
    { value:'120+',    label:'Countries',            desc:'Students worldwide',        delay:'0.5s' },
  ];

  testimonials = [
    { name:'Ahmed Hassan', role:'Frontend Developer', income:'$3,200/mo', text:'The AI roadmap took me from basic HTML to a React job in 60 days. Income prediction was accurate to the week!',   delay:'0s'    },
    { name:'Sarah K.',     role:'UI/UX Freelancer',   income:'$2,800/mo', text:'The portfolio analyzer told me exactly what was missing. Got my first Upwork client in 30 days.',                 delay:'0.12s' },
    { name:'Carlos M.',    role:'Full Stack Dev',      income:'$5,500/mo', text:'The 90-day roadmap was so detailed I never felt lost. Career analysis showed paths I never considered.',          delay:'0.24s' },
  ];

  constructor(private zone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.heroVisible = true;
      this._startDashLoop();
    }, 80);

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const id = (e.target as HTMLElement).dataset['section'];
        if (id === 'how')          { this.howVisible = true; this._startHowLoop(); }
        if (id === 'features')     this.featuresVisible     = true;
        if (id === 'journey')      this.journeyVisible      = true;
        if (id === 'ai')           { this.aiVisible = true; this._startChatLoop(); }
        if (id === 'stats')        this.statsVisible        = true;
        if (id === 'testimonials') this.testimonialsVisible = true;
        if (id === 'cta')          this.ctaVisible          = true;
      });
    }, { threshold: 0.12 });

    ([
      [this.howRef,          'how'],
      [this.featuresRef,     'features'],
      [this.journeyRef,      'journey'],
      [this.aiRef,           'ai'],
      [this.statsRef,        'stats'],
      [this.testimonialsRef, 'testimonials'],
      [this.ctaRef,          'cta'],
    ] as [ElementRef, string][]).forEach(([ref, id]) => {
      if (ref?.nativeElement) {
        ref.nativeElement.dataset['section'] = id;
        this.observer.observe(ref.nativeElement);
      }
    });
  }

  // ── Dashboard preview loop ──────────────────────────────
  private _startDashLoop(): void {
    this.dashTimers.forEach(t => clearTimeout(t));
    this.dashTimers = [];
    this.dashStep   = 0;
    this.dashCount  = 0;
    this.dashIncome = 0;

    // step 1 — ring draws + counter  (was 600ms)
    this.dashTimers.push(setTimeout(() => {
      this.zone.run(() => { this.dashStep = 1; this._countUp('dashCount', 0, 80, 600); });
    }, 300));

    // step 2 — bars grow + income counts  (was 2000ms)
    this.dashTimers.push(setTimeout(() => {
      this.zone.run(() => { this.dashStep = 2; this._countUp('dashIncome', 0, 3200, 500); });
    }, 1100));

    // step 3 — task 1 done  (was 3200ms)
    this.dashTimers.push(setTimeout(() => {
      this.zone.run(() => { this.dashStep = 3; });
    }, 1900));

    // step 4 — task 2 done  (was 3900ms)
    this.dashTimers.push(setTimeout(() => {
      this.zone.run(() => { this.dashStep = 4; });
    }, 2500));

    // step 5 — task 3 active  (was 4600ms)
    this.dashTimers.push(setTimeout(() => {
      this.zone.run(() => { this.dashStep = 5; });
    }, 3100));

    // step 6 — toast  (was 5400ms)
    this.dashTimers.push(setTimeout(() => {
      this.zone.run(() => { this.dashStep = 6; });
    }, 3700));

    // reset + loop  (was 8200ms → now 5500ms total)
    this.dashTimers.push(setTimeout(() => {
      this.zone.run(() => {
        this.dashStep = 0; this.dashCount = 0; this.dashIncome = 0;
        this.dashTimers.push(setTimeout(() => {
          this.zone.run(() => this._startDashLoop());
        }, 300));
      });
    }, 5500));
  }

  private _countUp(prop: 'dashCount' | 'dashIncome', from: number, to: number, duration: number): void {
    const steps = 40;
    const interval = duration / steps;
    let current = from;
    const increment = (to - from) / steps;
    const t = setInterval(() => {
      current = Math.min(current + increment, to);
      this.zone.run(() => { (this as any)[prop] = Math.round(current); });
      if (current >= to) clearInterval(t);
    }, interval);
    this.dashTimers.push(t as any);
  }

  // ── How It Works step loop ──────────────────────────────
  private _startHowLoop(): void {
    this.howTimers.forEach(t => clearTimeout(t));
    this.howTimers = [];
    this.howStep = 0;
    this._advanceHow(1);
  }
  private _advanceHow(step: number): void {
    const delay = step === 1 ? 200 : 800;   // was 400/1400 — 2× faster
    const t = setTimeout(() => {
      this.zone.run(() => {
        this.howStep = step;
        if (step < 4) {
          this._advanceHow(step + 1);
        } else {
          const reset = setTimeout(() => {
            this.zone.run(() => {
              this.howStep = 0;
              const restart = setTimeout(() => this.zone.run(() => this._advanceHow(1)), 400); // was 600
              this.howTimers.push(restart);
            });
          }, 1200); // was 2200
          this.howTimers.push(reset);
        }
      });
    }, delay);
    this.howTimers.push(t);
  }

  // ── Chat loop engine ────────────────────────────────────
  // Timing (ms): msg1 → typing → msg2 → pause → msg3 → typing → msg4 → pause → RESET
  private readonly STEPS: number[] = [
    200,   // step 1 → show msg1          (was 400)
    600,   // step 2 → show typing1       (was 1100)
    1400,  // step 3 → hide typing, msg2  (was 2400)
    2400,  // step 4 → show msg3          (was 4200)
    2900,  // step 5 → show typing2       (was 4900)
    3900,  // step 6 → hide typing, msg4  (was 7100)
    5500,  // step 7 → pause then reset   (was 10500)
  ];

  private _startChatLoop(): void {
    this._clearTimers();
    this._scheduleStep(0);
  }

  private _scheduleStep(index: number): void {
    if (index >= this.STEPS.length) {
      // Reset: wipe messages, wait 400ms, then restart  (was 800)
      const t = setTimeout(() => {
        this.zone.run(() => {
          this.chatReset = true;
          this.chatStep  = 0;
          setTimeout(() => {
            this.chatReset = false;
            this._scheduleStep(0);
          }, 400);
        });
      }, 600);  // was 1200
      this.chatTimers.push(t);
      return;
    }

    const t = setTimeout(() => {
      this.zone.run(() => {
        this.chatStep = index + 1;
        this._scheduleStep(index + 1);
      });
    }, this.STEPS[index]);

    this.chatTimers.push(t);
  }

  private _clearTimers(): void {
    this.chatTimers.forEach(t => clearTimeout(t));
    this.chatTimers = [];
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this._clearTimers();
    this.howTimers.forEach(t => clearTimeout(t));
    this.dashTimers.forEach(t => clearTimeout(t));
  }

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled = window.scrollY > 50; }
}
