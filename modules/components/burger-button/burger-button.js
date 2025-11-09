import { Trigger } from '../trigger.js';

export class BurgerButton extends Trigger {
  constructor({active = false} = {}) {
    super({
      active,
      html : `
      <button class="button burger-button ${active ? 'is-active' : ''}" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    `
    })
  }
}