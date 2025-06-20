import * as PetiteVue from 'petite-vue';

PetiteVue.createApp({
    card: PetiteVue.reactive({
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
      },
      renderTags(str) {
        return str
          .replace(/\{artifact\}/g, '<span class="text-blue-500">')
          .replace(/\{\/artifact\}/g, '</span>')
          .replace(/\{creature\}/g, '<span class="text-red-500">')
          .replace(/\{\/creature\}/g, '</span>')
          .replace(/\{player\}/g, '<span class="text-gray-500">')
          .replace(/\{\/player\}/g, '</span>')
          .replace(/\{spell\}/g, '<span class="text-yellow-500">')
          .replace(/\{\/spell\}/g, '</span>')
          .replace(/\{def\}/g, '<span class="stat-inline bg-blue-500">')
          .replace(/\{\/def\}/g, '</span>')
          .replace(/\{str\}/g, '<span class="stat-inline bg-red-500">')
          .replace(/\{\/str\}/g, '</span>')
          .replace(/\{life\}/g, '<span class="stat-inline bg-gray-800">')
          .replace(/\{\/life\}/g, '</span>');
      }
    }),
    app: PetiteVue.reactive({
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
    })
}).directive('click-outside', function (ctx) {
  document.body.addEventListener('click', function (event) {
    // here I check that click was outside the el and his children
    if (!(ctx.el == event.target || ctx.el.contains(event.target))) {
      // and if it did, call method provided in attribute value
      ctx.get();
    }
  });
}).mount('#app');

