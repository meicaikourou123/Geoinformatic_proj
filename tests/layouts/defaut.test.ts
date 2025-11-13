import { mount } from "@vue/test-utils";
import DefaultLayout from "@/layouts/default.vue";
import { h } from "vue";

import SidebarMenu from "@/components/SidebarMenu.vue";
import TrackInfoPanel from "@/components/TrackInfoPanel.vue";
import SensorChart from "@/components/SensorChart.vue";

// ------- Naive UI mocks -------
const NButton = {
    name: "NButton",
    emits: ["click"],
    render() {
        return h(
            "button",
            {
                class: "mock-nbutton",
                onClick: () => this.$emit("click"),
            },
            this.$slots.default?.()
        );
    },
};

const NTooltip = {
    name: "NTooltip",
    render() {
        return h("div", { class: "mock-tooltip" }, [
            this.$slots.trigger?.(),
            this.$slots.default?.(),
        ]);
    },
};
// -------------------------------

describe("Default Layout", () => {
    let wrapper: any;

    beforeEach(() => {
        wrapper = mount(DefaultLayout, {
            global: {
                stubs: {
                    NButton,
                    NTooltip,
                    SidebarMenu: {
                        template: "<div class='sidebar-menu-stub'></div>",
                    },
                    TrackInfoPanel: {
                        props: ["selectedPoint"],
                        template: `
              <div 
                class="track-panel-stub"
                :style="{ display: selectedPoint ? '' : 'none' }">
              </div>
            `,
                    },
                    SensorChart: {
                        template: "<div class='chart-stub'></div>",
                    },
                },
                mocks: {
                    $router: {
                        push: vi.fn(),
                    },
                },
            },
        });
    });

    test("renders layout wrapper", () => {
        expect(wrapper.find(".layout").exists()).toBe(true);
    });

    test("SidebarMenu hidden when collapsed = true", async () => {
        wrapper.vm.collapsed = true;
        await wrapper.vm.$nextTick();

        const menu = wrapper.find(".sidebar-menu-stub");
        expect(menu.element.style.display).toBe("none");
    });

    test("toggle button switches collapsed", async () => {
        const btn = wrapper.find(".mock-nbutton");
        expect(btn.exists()).toBe(true);

        // 初始 collapsed 为 true（根据 default.vue 里的默认值）
        expect(wrapper.vm.collapsed).toBe(true);

        await btn.trigger("click");

        expect(wrapper.vm.collapsed).toBe(false);
    });

    test("SensorChart visible only when showChart = true", async () => {
        wrapper.vm.showChart = false;
        await wrapper.vm.$nextTick();
        expect(wrapper.find(".chart-stub").exists()).toBe(false);

        wrapper.vm.showChart = true;
        await wrapper.vm.$nextTick();
        expect(wrapper.find(".chart-stub").exists()).toBe(true);
    });
});



// Mock naive-ui
vi.mock("naive-ui", () => ({
    NTooltip: {
        name: "NTooltip",
        template: "<div><slot name='trigger'/><slot/></div>"
    },
    NButton: {
        name: "NButton",
        emits: ["click"],
        template: "<button class='mock-nbutton' @click='$emit(\"click\")'><slot/></button>"
    },
    NConfigProvider: {
        name: "NConfigProvider",
        template: "<div><slot/></div>"
    },
    NDatePicker: {
        name: "NDatePicker",
        props: ["value"],
        emits: ["update:value"],
        template: `
          <input
              class="mock-datepicker"
              type="date"
              @input="$emit('update:value', $event.target.value)"
          />
        `
    },
    NSpace: {
        name: "NSpace",
        template: "<div class='mock-nspace'><slot/></div>"
    },
    NSwitch: {
        name: "NSwitch",
        props: ["value"],
        emits: ["update:value"],
        template: `
            <input
                type="checkbox"
                class="mock-nswitch"
                :checked="value"
                @change="$emit('update:value', $event.target.checked)"
            />
        `
    },
    NSlider: {
        name: "NSlider",
        props: ["value"],
        emits: ["update:value"],
        template: `
        <input 
            type="range"
            class="mock-nslider"
            :value="value"
            @input="$emit('update:value', Number($event.target.value))"
        />
    `
    },
    NTimePicker: {
        name: "NTimePicker",
        emits: ["update:value"],
        template: `
        <input 
            class="mock-ntimepicker"
            type="time"
            @input="$emit('update:value', $event.target.value)"
        />
    `
    },
    NGrid: {
        name: "NGrid",
        template: "<div class='mock-ngrid'><slot/></div>"
    },
    NGi: {
        name: "NGi",
        template: "<div class='mock-ngi'><slot/></div>"
    }
}));

// Mock NuxtPage
vi.mock("#app", () => ({
    useRouter: () => ({ push: vi.fn() })
}));

vi.mock("#components", () => ({
    NuxtPage: {
        template: "<div class='nuxt-page'/>"
    }
}));

// Mock OpenLayers heavy imports
vi.mock("ol/Map", () => ({ default: vi.fn() }));
vi.mock("ol/View", () => ({ default: vi.fn() }));

describe("Default Layout", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = mount(DefaultLayout, {
            global: {
                stubs: {
                    SidebarMenu,
                    TrackInfoPanel,
                    SensorChart,
                    NuxtPage: { template: "<div class='nuxt-page'></div>" }
                }
            }
        });
    });

    // 1. Renders layout
    it("renders layout wrapper", () => {
        expect(wrapper.find(".layout").exists()).toBe(true);
        expect(wrapper.find(".nuxt-page").exists()).toBe(true);
    });

    // 2. SidebarMenu hidden when collapsed=true
    it("SidebarMenu hidden when collapsed = true", () => {
        const sidebar = wrapper.findComponent(SidebarMenu);
        expect(sidebar.element.style.display).toBe("none"); // v-show = false
    });

    // 3. toggle button changes collapsed state
    it("toggle button switches collapsed", async () => {
        const btn = wrapper.find(".global-toggle-btn");
        expect(btn.exists()).toBe(true);

        await btn.trigger("click");
        await wrapper.vm.$nextTick();

        const sidebar = wrapper.findComponent(SidebarMenu);
        expect(sidebar.element.style.display).not.toBe("none");
    });

    // 4. TrackInfoPanel visible only when selectedPoint exists and not collapsed
    it("TrackInfoPanel visibility depends on selectedPoint & collapsed", async () => {
        const panel = wrapper.findComponent(TrackInfoPanel);
        expect(panel.element.style.display).toBe("none"); // both null & collapsed=true

        // collapsed = false
        wrapper.vm.collapsed = false;
        wrapper.vm.selectedPoint = { lon: 0, lat: 0 };
        await wrapper.vm.$nextTick();

        expect(panel.element.style.display).not.toBe("none");
    });

    // 5. SensorChart visible only when showChart = true
    it("SensorChart visible only when showChart = true", async () => {
        expect(wrapper.findComponent(SensorChart).exists()).toBe(false);

        wrapper.vm.showChart = true;
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent(SensorChart).exists()).toBe(true);
    });

    // 6. closing TrackInfoPanel resets selectedPoint and hides chart
    it("@close resets selectedPoint and hides chart", async () => {
        wrapper.vm.collapsed = false;
        wrapper.vm.selectedPoint = { lon: 0, lat: 0 };
        wrapper.vm.showChart = true;
        await wrapper.vm.$nextTick();

        const panel = wrapper.findComponent(TrackInfoPanel);
        panel.vm.$emit("close");

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedPoint).toBe(null);
        expect(wrapper.vm.showChart).toBe(false);
    });
});