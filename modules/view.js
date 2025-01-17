import { Application } from "./app.js";

export const View = function () { };

View.prototype = {
  templatePath: null,

  containerSelector: null,

  containerElement: null,

  templateSelector: null,

  templateHtmls: {},

  template: null,

  element: null,

  parentElement: null,

  events: null,

  renderedEvents: null,

  data: null,

  state: null,

  getContainer() {
    if (this.containerElement != null) {
      return this.containerElement
    }
    if (this.containerSelector != null) {
      return document.body.querySelector(this.containerSelector);
    }
    return document.body;
  },
  initTemplate: async function () {
    try {
      this.getContainer().insertAdjacentHTML(
        'afterbegin',
        this.templateHtmls[this._class.name].templateHtml
      );
      this.template = this.getContainer()
        .querySelector(this.templateSelector);
      if (this.template == null) {
        throw new Error('Element nof found for selector ' + this.templateSelector);
      }
      this.getContainer().removeChild(this.template);
      this.checkContainer();
    } catch (error) {
      console.error('Error initializing template:', error);
      throw error;
    }
  },

  initElement() {
    this.element = this.template.cloneNode(true);
    for (var k in this.events) {
      var spaceIdx = k.indexOf(' ');
      if (spaceIdx != -1) {
        this.element.querySelector(k.substring(spaceIdx + 1))
          .addEventListener(k.substring(0, spaceIdx), this[this.events[k]].bind(this));
      } else {
        this.element.addEventListener(k, this[this.events[k]].bind(this));
      }
    }
  },

  setRenderedEvents(targetEl) {
    const target = targetEl ? targetEl : this.element;
    for (let event in this.renderedEvents) {
      target.addEventListener(event, (e) => {
        const entry = this.renderedEvents[event];
        for (let selector in entry) {
          if (e.target.matches && e.target.matches(selector)) {
            if (entry[selector].indexOf('.') < 0) {
              this[entry[selector]].bind(this).call(this, e);
            } else {
              const parts = entry[selector].split('.');
              if (this.namespaces[parts[0]] && this.namespaces[parts[0]][parts[1]]) {
                this.namespaces[parts[0]][parts[1]].bind(this).call(this, e)
              }
            }
          }
        }
      })
    }
  },

  initState() {
    const initialState = Application.getViewState(this) || {};
    this.initialState = initialState;
    const instance = this;
    this.state = new Proxy(initialState, {
      set(target, property, value) {
        target[property] = value;
        Application.setViewState(instance);
        if (instance.handleStateChange) {
          instance.handleStateChange(target);
        }
        return true;
      },
      get(target, property) {
        return target[property]
      }
    });
  },

  show() {
    if (this.element === null) {
      this.initElement();
      this.initState();
      this.data = {};
    }
    this.getContainer().appendChild(this.element);
    console.log('show view', this._class.name)
    this.checkContainer();
  },

  hide() {
    this.getContainer().removeChild(this.element);
    console.log('hide view ', this._class.name);
    this.checkContainer();
  },

  isShown() {
    return this.getContainer().contains(this.element);
  },

  remove() {
    this.getContainer().removeChild(this.element);
    this.checkContainer();
    this.element = null;
    this.data = null;
  },

  find(selector) {
    return this.element.querySelector(selector);
  },

  findAll(selector) {
    return this.element.querySelectorAll(selector);
  },

  checkContainer() {
    if (this.containerSelector == null
      && this.containerElement == null) {
      return;
    }
    var container = this.getContainer();
    if (container.children.length == 0) {
      container.style.display = 'none';
    } else {
      container.style.display = '';
    }
  },

  initViewTemplateHtml: async function () {
    if (!View.prototype.templateHtmls[this._class.name]
      || !View.prototype.templateHtmls[this._class.name]._templateHtmlPromise) {
      View.prototype.templateHtmls[this._class.name] = {};
      View.prototype.templateHtmls[this._class.name]._templateHtmlPromise = (async () => {
        const response = await fetch(this.templatePath);
        View.prototype.templateHtmls[this._class.name].templateHtml = await response.text();
        return View.prototype.templateHtmls[this._class.name].templateHtml;
      })()
    }
    await View.prototype.templateHtmls[this._class.name]._templateHtmlPromise;
  },

  init: async function () {
    /*
    if (!View.prototype.templateHtmls[this._class.name]
      || !View.prototype.templateHtmls[this._class.name]._templateHtmlPromise) {
      View.prototype.templateHtmls[this._class.name] = {};
      View.prototype.templateHtmls[this._class.name]._templateHtmlPromise = (async () => {
        const response = await fetch(this.templatePath);
        View.prototype.templateHtmls[this._class.name].templateHtml = await response.text();
        return View.prototype.templateHtmls[this._class.name].templateHtml;
      })()
    }
    await View.prototype.templateHtmls[this._class.name]._templateHtmlPromise;
    */
    await this.initViewTemplateHtml();

    if (this.templatePath == null) {
      throw new Error('template path not defined');
    }
    try {
      this.initTemplate();
      this.initElement();
      this.data = {};
      this.initState();
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  },

};
View.create = async function (SubClass, ...args) {
  if (!Object.prototype.isPrototypeOf.call(View.prototype, SubClass.prototype)) {
    SubClass.prototype = Object.create(View.prototype);
    SubClass.prototype.constructor = SubClass;
  }
  if (!SubClass.prototype.defaults && SubClass.prototype.constructor.defaults) {
    SubClass.prototype.defaults = SubClass.prototype.constructor.defaults;
  }
  const instance = new SubClass(...args);
  instance._class = SubClass;

  await instance.init();
  return instance;
};
