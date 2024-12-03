export const View = function () {};

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

  data: null,

  getContainer() {
    if(this.containerElement != null) {
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

  show() {
    if (this.element === null) {
      this.initElement();
      this.data = {};
    }
    this.getContainer().appendChild(this.element);
    this.checkContainer();
  },

  hide() {
    this.getContainer().removeChild(this.element);
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

  init: async function () {
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
    
    if (this.templatePath == null) {
      throw new Error('template path not defined');
    }
    try {
      this.initTemplate();
      this.initElement();
      this.data = {};
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
