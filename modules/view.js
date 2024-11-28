export const View = function () { };

View.prototype = {
  templatePath: null,

  containerSelector: null,

  templateSelector: null,

  template: null,

  element: null,

  events: null,

  data: null,

  getContainer () {
    if (this.containerSelector != null) {
      return document.body.querySelector(this.containerSelector);
    }
    return document.body;
  },

  initTemplate: async function  () {
    if (this.templatePath == null) {
      throw new Error('template path not defined');
    }
    try {
      const response = await fetch(this.templatePath);
      const data = await response.text();

      this.getContainer().insertAdjacentHTML('afterbegin', data);
      this.template = this.getContainer().querySelector(this.templateSelector);
      if (this.template == null) {
        throw new Error('Element nof found for selector ' + this.templateSelector);
      }
      this.getContainer().removeChild(this.template);
      this.checkContainer();
      console.log('template initiated')
    } catch (error) {
      console.error('Error initializing template:', error);
      throw error;
    }
  },

  initElement () {
    this.element = this.template.cloneNode(true);
    for (var k in this.events) {
      var spaceIdx = k.indexOf(' ');
      if (spaceIdx != -1) {
        this.element.querySelector(k.substring(spaceIdx + 1)).addEventListener(k.substring(0, spaceIdx), this[this.events[k]].bind(this));
      } else {
        this.element.addEventListener(k, this[this.events[k]].bind(this));
      }
    }
  },

  init: async function ()  {
    try {
      await this.initTemplate();
      this.initElement();
      this.data = {};
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  },

  show () {
    if (this.element === null) {
      this.initElement();
      this.data = {};
    }
    this.getContainer().appendChild(this.element);
    this.checkContainer();
  },

  hide () {
    this.getContainer().removeChild(this.element);
    this.checkContainer();
  },

  isShown () {
    return this.getContainer().contains(this.element);
  },

  remove () {
    this.getContainer().removeChild(this.element);
    this.checkContainer();
    this.element = null;
    this.data = null;
  },

  find (selector) {
    return this.element.querySelector(selector);
  },

  findAll (selector) {
    return this.element.querySelectorAll(selector);
  },

  checkContainer () {
    if (this.containerSelector == null) {
      return;
    }
    var container = this.getContainer();
    if (container.children.length == 0) {
      container.style.display = 'none';
    } else {
      container.style.display = '';
    }
  }
};

View.create = async function () {
  const instance = new this();
  await instance.init?.();
  return instance;
};