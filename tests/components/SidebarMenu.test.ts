import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import SidebarMenu from "~/components/SidebarMenu.vue";

// mock Naive-UI
vi.mock("naive-ui", () => ({
    NDatePicker: { name: "NDatePicker", render: () => null },
    NButton: { name: "NButton", render: () => null },
    NDataTable: { name: "NDataTable", render: () => null },
    NConfigProvider: { name: "NConfigProvider", render: () => null },
}));
vi.mock("naive-ui", () => {
    const stub = (name) => ({
        name,
        template: `<div><slot /></div>`
    });

    return {
        NDatePicker: stub("NDatePicker"),
        NButton: stub("NButton"),
        NDataTable: stub("NDataTable"),
        NConfigProvider: stub("NConfigProvider")
    };
});

describe("SidebarMenu", () => {
    it("renders correctly", () => {
        const wrapper = mount(SidebarMenu);

        // Check something that REALLY exists
        expect(wrapper.find(".query-button").exists()).toBe(true);
        expect(wrapper.text()).toContain("query"); // This exists

        // Data table isn't shown until query result exists
        expect(wrapper.find(".result-panel").exists()).toBe(false);
    });
});


import { mount } from "@vue/test-utils";
import SidebarMenu from "@/components/SidebarMenu.vue";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Naive UI
vi.mock("naive-ui", () => ({
    NConfigProvider: { template: "<div><slot /></div>" },
    NDatePicker: { template: "<input />" },
    NButton: { template: "<button><slot/></button>" },
    NDataTable: {
        props: ["columns", "data"],
        template: `<div class="mock-table">
        <div v-for="row in data" :key="row.stormcode" class="mock-row">
          {{ row.stormcode }}
        </div>
      </div>`
    }
}));

// mock useDraggable
vi.mock("@/composables/useDraggable", () => ({
    useDraggable: () => ({
        startDrag: vi.fn()
    })
}));

// mock formatTimestamp
vi.mock("~/utils/formats.ts", () => ({
    formatTimestamp: vi.fn((ts) => `formatted-${ts}`)
}));

describe("SidebarMenu.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = mount(SidebarMenu, {
            global: {
                stubs: {}
            }
        });
    });

    it("renders sidebar container", () => {
        expect(wrapper.find(".sidebar").exists()).toBe(true);
    });

    it("calls queryData and updates queryResult", async () => {
        // mock $fetch 返回假数据
        const mockData = [
            { stormcode: "S001", points: [] },
            { stormcode: "S002", points: [] }
        ];

        global.$fetch = vi.fn(async () => mockData);

        const btn = wrapper.find("button");
        expect(btn.exists()).toBe(true);

        await btn.trigger("click");

        expect(global.$fetch).toHaveBeenCalled();
        expect(wrapper.vm.queryResult.length).toBe(2);
    });

    it("renders results when queryResult has data", async () => {
        wrapper.vm.queryResult = [
            { stormcode: "ST01", points: [] }
        ];
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".mock-row").exists()).toBe(true);
    });

    it("emits drawTrajectory on checkbox change", async () => {
        const sampleRows = [
            { stormcode: "A01", points: [] },
            { stormcode: "A02", points: [] }
        ];

        wrapper.vm.queryResult = sampleRows;
        await wrapper.vm.$nextTick();

        wrapper.vm.onCheckboxChange(["A01"]);

        const emitted = wrapper.emitted("drawTrajectory");
        expect(emitted).toBeTruthy();
        expect(emitted[0][0].code).toBe("A01");
    });
});