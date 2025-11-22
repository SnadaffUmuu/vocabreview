import { Trigger } from '../trigger.js';

export class BurgerButton extends Trigger {
  constructor({
      active = false,
      cssClasses = []
    } = {}
  ) {
    super({
      active,
      html : `
      <button class="button burger-button ${active ? 'is-active' : ''} ${cssClasses ? cssClasses.join(' ') : ''}" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    `
    })
  }
}