export const NConfigProvider = {
    name: "NConfigProvider",
    template: "<div><slot /></div>"
};

export const NDatePicker = {
    name: "NDatePicker",
    template: "<input />",
    props: ["value"]
};

export const NButton = {
    name: "NButton",
    template: "<button><slot /></button>"
};

export const NDataTable = {
    name: "NDataTable",
    props: ["columns", "data"],
    template: `
    <table class="n-data-table">
      <tbody>
        <tr v-for="row in data" :key="row.stormcode">
          <td>{{ row.stormcode }}</td>
        </tr>
      </tbody>
    </table>
  `
};

export const NTooltip = { template: "<div><slot name='trigger'/><slot/></div>" };
export const NSwitch = { template: "<input type='checkbox' @change='$emit(\"update:value\", $event.target.checked)'/>" };
export const NSlider = { template: "<input type='range' @input='$emit(\"update:value\", Number($event.target.value))'/>" };
export const NCheckbox = {
    props: ["checked"],
    template: `<input type='checkbox' :checked='checked' @change='$emit("update:checked",$event.target.checked)'/>`
};
export const NGrid = { template: "<div><slot/></div>" };
export const NGi = { template: "<div><slot/></div>" };
export const NSpace = { template: "<div><slot/></div>" };
export const NTimePicker = { template: "<input @input='$emit(\"update:value\", Date.now())'/>" };