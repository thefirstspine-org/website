import * as PetiteVue from 'petite-vue';

PetiteVue.createApp({
    card: function() {
      return {
        $template: '#card-template',
        card: null,
        template: '',
        loadAndRenderCard(id) {
          console.log(`Load card ${id}`);
          fetch(`https://game-assets.thefirstspine.fr/cards/${id}`)
            .then((response) => {
              response.json().then((json) => {
                console.log(`Card loaded:`,  json);
                this.card = json;
              });
            });
        },
        renderCardBase64(str) {
          this.card = JSON.parse(atob(str));
        }
      }
    },
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
}).directive('click-outside', function (ctx) {
  document.body.addEventListener('click', function (event) {
    // here I check that click was outside the el and his children
    if (!(ctx.el == event.target || ctx.el.contains(event.target))) {
      // and if it did, call method provided in attribute value
      ctx.get();
    }
  });
}).mount('#app');

