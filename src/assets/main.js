import * as PetiteVue from 'petite-vue';

const app = PetiteVue.createApp({
    toggles: {},
    toggleOn(label) {
      this.toggles[label] = true;
    },
    toggleOff(label) {
      this.toggles[label] = false;
    },
    isToggled(label) {
      return this.toggles[label] || false;
    },
});

app.directive('click-outside', function (ctx) {
  document.body.addEventListener('click', function (event) {
    console.log('clickOutsideEvent');
    // here I check that click was outside the el and his children
    if (!(ctx.el == event.target || ctx.el.contains(event.target))) {
      // and if it did, call method provided in attribute value
      ctx.get();
    }
  });
}).mount();

app.mount('#app');
