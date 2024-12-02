/*
Мы наследуем Slide от  View, при этом перенося часть свойств из конструктора Slide в прототип Slide. А нельзя постороить цепочку так, чтобы создать прототип Slide, который также наследовал бы View, и просто прописать эти статические свойства в прототип слайда по анлогии с тем, как мы описываем объект View.prototype = {...}?
*/

const View = function () { };
View.prototype = {
  text: null,
  init: async function () {
    console.log(this.defaults)
  }
}
View.create = async function (SubClass, ...args) {
  if (!Object.prototype.isPrototypeOf.call(View.prototype, SubClass.prototype)) {
    SubClass.prototype = Object.create(View.prototype);
    SubClass.prototype.constructor = SubClass;
  }
  const instance = new SubClass(...args);
  await instance.init();
  return instance;
};

const Slide = function (text) {
  this.text = text;
}
Slide.prototype = {
  defaults : '111'
}

//Как сделать так, чтобы Slide наследовал также и от View?

const theSlide1 = await View.create(Slide, "sample text");
console.log(theSlide1);