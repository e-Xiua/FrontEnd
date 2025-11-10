import { Injectable } from '@angular/core';

// Strategy Pattern for Animations
export interface AnimationStrategy {
  getAnimationClass(): string;
  getDuration(): number;
}

@Injectable({
  providedIn: 'root'
})
export class FadeInStrategy implements AnimationStrategy {
  getAnimationClass(): string {
    return 'animate-fade-in';
  }

  getDuration(): number {
    return 300;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SlideInStrategy implements AnimationStrategy {
  getAnimationClass(): string {
    return 'animate-slide-in';
  }

  getDuration(): number {
    return 300;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ScaleInStrategy implements AnimationStrategy {
  getAnimationClass(): string {
    return 'animate-scale-in';
  }

  getDuration(): number {
    return 200;
  }
}

@Injectable({
  providedIn: 'root'
})
export class NoAnimationStrategy implements AnimationStrategy {
  getAnimationClass(): string {
    return '';
  }

  getDuration(): number {
    return 0;
  }
}

// Animation Context
@Injectable({
  providedIn: 'root'
})
export class AnimationContext {
  private strategy: AnimationStrategy;

  constructor() {
    this.strategy = new FadeInStrategy(); // Default strategy
  }

  setStrategy(strategy: AnimationStrategy): void {
    this.strategy = strategy;
  }

  applyAnimation(): string {
    return this.strategy.getAnimationClass();
  }

  getDuration(): number {
    return this.strategy.getDuration();
  }

  getCurrentStrategy(): AnimationStrategy {
    return this.strategy;
  }
}

// Animation Strategy Factory
@Injectable({
  providedIn: 'root'
})
export class AnimationStrategyFactory {
  constructor(
    private fadeInStrategy: FadeInStrategy,
    private slideInStrategy: SlideInStrategy,
    private scaleInStrategy: ScaleInStrategy,
    private noAnimationStrategy: NoAnimationStrategy
  ) {}

  createStrategy(type: 'fade' | 'slide' | 'scale' | 'none'): AnimationStrategy {
    switch (type) {
      case 'fade':
        return this.fadeInStrategy;
      case 'slide':
        return this.slideInStrategy;
      case 'scale':
        return this.scaleInStrategy;
      case 'none':
        return this.noAnimationStrategy;
      default:
        return this.fadeInStrategy;
    }
  }
}
