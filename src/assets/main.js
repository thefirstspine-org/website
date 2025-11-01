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
          .replace(/\{defense\}/g, '<span class="stat-inline bg-blue-500">')
          .replace(/\{\/defense\}/g, '</span>')
          .replace(/\{str\}/g, '<span class="stat-inline bg-red-500">')
          .replace(/\{\/str\}/g, '</span>')
          .replace(/\{strength\}/g, '<span class="stat-inline bg-red-500">')
          .replace(/\{\/strength\}/g, '</span>')
          .replace(/\{life\}/g, '<span class="stat-inline bg-gray-800">')
          .replace(/\{\/life\}/g, '</span>');
      }
    }),
    app: PetiteVue.reactive({
      toggles: {},
      mounted: false,
      userInfo: {
        isLoggedIn: false,
        userId: null,
      },
      toggleOn(label) {
        this.toggles[label] = true;
      },
      toggleOff(label) {
        this.toggles[label] = false;
      },
      isToggled(label) {
        return this.toggles[label] || false;
      },
      async mount() {
        this.mounted = true;
        console.log('App mounted');
        const request = await fetch('/user-info');
        const data = await request.json();
        this.userInfo = data;
      }
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

const inputs = document.querySelectorAll(".otp-field input");
inputs.forEach((input, index) => {
    input.dataset.index = index;
    input.addEventListener("keyup", handleOtp);
    input.addEventListener("paste", handleOnPasteOtp);
});
function handleOtp(e) {
    /**
     * <input type="text" 👉 maxlength="1" />
     * 👉 NOTE: On mobile devices `maxlength` property isn't supported,
     * So we to write our own logic to make it work. 🙂
     */
    const input = e.target;
    let value = input.value;
    let isValidInput = value.match(/[0-9a-z]/gi);
    input.value = "";
    input.value = isValidInput ? value[0] : "";
    let fieldIndex = input.dataset.index;
    if (fieldIndex < inputs.length - 1 && isValidInput) {
        input.nextElementSibling.focus();
    }
    if (e.key === "Backspace" && fieldIndex > 0) {
        input.previousElementSibling.focus();
    }
    if (fieldIndex == inputs.length - 1 && isValidInput) {
        submit();
    }
}
function handleOnPasteOtp(e) {
    const data = e.clipboardData.getData("text");
    const value = data.split("");
    if (value.length === inputs.length) {
        inputs.forEach((input, index) => (input.value = value[index]));
        submit();
    }
}
function submit() {
    console.log("Submitting...");
    // 👇 Entered OTP
    let otp = "";
    inputs.forEach((input) => {
        otp += input.value;
        input.disabled = true;
        input.classList.add("disabled");
    });
    window.location.href = `/code?code=${otp.toUpperCase()}`;
}
