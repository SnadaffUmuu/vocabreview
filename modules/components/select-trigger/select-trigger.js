import { Trigger } from '../trigger.js';

export class SelectTrigger extends Trigger {
  constructor({
      active = false,
      cssClasses = []
    } = {}
  ) {
    super({
      active,
      html : `
      <div class="button select-button ${active ? 'is-active' : ''} ${cssClasses ? cssClasses.join(' ') : ''}" aria-label="Menu">sources</div>
    `
    })
  }

  setLabel(text) {
    this.el.textContent = text;
  }
}