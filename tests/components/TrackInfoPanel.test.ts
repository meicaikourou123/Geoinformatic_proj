import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import TrackInfoPanel from "~/components/TrackInfoPanel.vue";

// ---------------------------------------------
// 1. MOCK Naive UI (preserve attrs + slot to avoid lost classes)
// ---------------------------------------------
vi.mock("naive-ui", () => {
    const stub = (name) => ({
        name,
        template: `<div v-bind="$attrs"><slot /></slot></div>`,
    });

    return {
        NSwitch: stub("NSwitch"),
        NSpace: stub("NSpace"),
        NTimePicker: stub("NTimePicker"),
        NButton: stub("NButton"),
        NSlider: stub("NSlider"),
        NGrid: stub("NGrid"),
        NGi: stub("NGi"),
        NTooltip: stub("NTooltip"),
        NCheckbox: stub("NCheckbox"),
    };
});

// 2. MOCK useDraggable to avoid real dragging logic errors
vi.mock("@/composables/useDraggable", () => ({
    useDraggable: () => ({
        startDrag: vi.fn(),
    }),
}));

// ---------------------------------------------
// TEST START
// ---------------------------------------------
describe("TrackInfoPanel.vue", () => {
    // mock props
    const baseProps = {
        trackData: {
            code: "A01",
            time: "2025-01-01T12:00:00Z",
            lon: 10,
            lat: 20,
            area: "MI",
        },
        sensors: [],
    };

    it("renders Storm Info title", () => {
        const wrapper = mount(TrackInfoPanel, { props: baseProps });

        expect(wrapper.text()).toContain("Storm Info");
    });

    it("emits close when handleClose is called", async () => {
        const wrapper = mount(TrackInfoPanel, { props: baseProps });

        // Initially, no close event should be emitted
        expect(wrapper.emitted("close")).toBeUndefined();

        // Directly call the component's close handler
        await wrapper.vm.handleClose();

        // Now the close event should be emitted
        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("emits drawBufferCircle when switch is turned on", async () => {
        const wrapper = mount(TrackInfoPanel, { props: baseProps });

        // Directly call the component's logic function (avoid switch mock event complexity)
        await wrapper.vm.onToggleDisplayBuffer(true);

        const emits = wrapper.emitted("drawBufferCircle");
        expect(emits).toBeTruthy();

        // Check emit payload format
        const payload = emits[0][0];
        expect(payload).toHaveProperty("distance");
        expect(payload).toHaveProperty("center");
    });

    it("emits querySensors when handleSearch() executed", async () => {
        const wrapper = mount(TrackInfoPanel, { props: baseProps });

        // activate toggle (to make popupCenter valid)
        wrapper.vm.popupCenter = [10, 20];

        await wrapper.vm.handleSearch();

        expect(wrapper.emitted("querySensors")).toBeTruthy();
    });
});



// mock naive-ui
vi.mock("naive-ui", () => ({
    NButton: { template: "<button><slot/></button>" },
    NTooltip: { template: "<div><slot name='trigger'/><slot/></div>" },
    NSwitch: {
        template: `<input type='checkbox' @change='$emit("update:value",$event.target.checked)'/>`
    },
    NSlider: {
        template: `<input type='range' @input='$emit("update:value",Number($event.target.value))'/>`
    },
    NCheckbox: {
        props: ["checked"],
        template: `<input type="checkbox" :checked="checked" @change='$emit("update:checked",$event.target.checked)'/>`
    },
    NGrid: { template: "<div><slot/></div>" },
    NGi: { template: "<div><slot/></div>" },
    NSpace: { template: "<div><slot/></div>" },
    NTimePicker: { template: "<input @input='$emit(\"update:value\", Date.now())'/>" }
}));

// mock draggable
vi.mock("@/composables/useDraggable", () => ({
    useDraggable: () => ({
        startDrag: vi.fn()
    })
}));

describe("TrackInfoPanel.vue", () => {
    let wrapper;

    const sensors = [
        { idsensore: 1, data_type: "temp", nomestazione: "A" },
        { idsensore: 2, data_type: "rain", nomestazione: "B" },
    ];

    beforeEach(() => {
        wrapper = mount(TrackInfoPanel, {
            props: {
                trackData: { lon: 10, lat: 20, time: new Date().toISOString() },
                sensors
            }
        });
    });

    it("renders panel", () => {
        expect(wrapper.find(".custom-popup-panel").exists()).toBe(true);
    });

    it("emits close when close button clicked", async () => {
        const btn = wrapper.find(".tip-close");
        expect(btn.exists()).toBe(true);

        await btn.trigger("click");

        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("switch on toggles active and emits drawBufferCircle", async () => {
        const sw = wrapper.find("input[type='checkbox']");
        await sw.setValue(true);

        expect(wrapper.emitted("drawBufferCircle")).toBeTruthy();
    });

    it("slider change emits drawBufferCircle", async () => {
        const slider = wrapper.find("input[type='range']");
        await slider.setValue(20);

        const emitted = wrapper.emitted("drawBufferCircle");
        expect(emitted).toBeTruthy();
        expect(emitted.pop()[0].distance).toBe(20000);
    });

    it("groupedSensors computed works", () => {
        const groups = wrapper.vm.groupedSensors;
        expect(Object.keys(groups)).toContain("temp");
        expect(Object.keys(groups)).toContain("rain");
    });

    it("toggle single sensor emits toggleSensor", () => {
        // toggle single sensor event
        wrapper.vm.onToggleSensor(sensors[0], 0, false);

        const em = wrapper.emitted("toggleSensor");
        expect(em).toBeTruthy();
        expect(em[0][0].sensor.idsensore).toBe(1);
    });

    it("toggle all sensors emits toggleAllSensors", () => {
        // toggle all sensors event
        wrapper.vm.onToggleAll(true);
        expect(wrapper.emitted("toggleAllSensors")).toBeTruthy();
    });

    it("querySelectedSensors emits correct data", () => {
        // query selected sensors
        wrapper.vm.handleQuerySelectedSensors();

        const em = wrapper.emitted("querySelectedSensors");
        expect(em).toBeTruthy();
        expect(em[0][0].selected.length).toBe(2);
    });
});