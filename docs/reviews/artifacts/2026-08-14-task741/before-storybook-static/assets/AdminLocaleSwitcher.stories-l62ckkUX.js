import{j as c}from"./iframe-BWqC60Cj.js";import{A as u}from"./AdminLocaleSwitcher-BG-P9FuP.js";import"./preload-helper-Dp1pzeXC.js";import"./server-DtWDQ7N5.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./server-D4e9MQwo.js";import"./LocaleSwitcher-DOTZVXuF.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./Stack-DqzY2ynC.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./loader-circle-DsIh30M6.js";import"./chevron-down-B9O36-Ph.js";var r,a,i,s,n,l,m,p,d;const{within:_,userEvent:h}=__STORYBOOK_MODULE_TEST__,he={title:"Admin/AdminLocaleSwitcher",component:u,tags:["autodocs"]},e={globals:{viewport:{value:"desktop1280",isRotated:!1}}},o={globals:{viewport:{value:"mobile320",isRotated:!1}}},t={parameters:{docs:{description:{story:"@320: language menu opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px. Use locale toolbar."}}},render:()=>c.jsx("div",{className:"p-4 max-w-xs",children:c.jsx(u,{})}),globals:{viewport:{value:"mobile320",isRotated:!1}},play:async({canvasElement:v})=>{const g=await _(v).findByRole("button");await h.click(g)}};e.parameters={...e.parameters,docs:{...(r=e.parameters)===null||r===void 0?void 0:r.docs,source:{originalSource:`{
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(i=e.parameters)===null||i===void 0||(a=i.docs)===null||a===void 0?void 0:a.source}}};o.parameters={...o.parameters,docs:{...(s=o.parameters)===null||s===void 0?void 0:s.docs,source:{originalSource:`{
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(l=o.parameters)===null||l===void 0||(n=l.docs)===null||n===void 0?void 0:n.source}}};t.parameters={...t.parameters,docs:{...(m=t.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: language menu opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px. Use locale toolbar.'
      }
    }
  },
  render: () => <div className="p-4 max-w-xs">\r
      <AdminLocaleSwitcher />\r
    </div>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  },
  // Task 576 — restores the open-sheet QA evidence WITHOUT a defaultOpen/controlled-mode prop:
  // MantineDropdownMenu is intentionally uncontrolled, so the only way to show the OPEN state is
  // a real interaction. Clicking the trigger bubbles to MantineDropdownMenu's mobile wrapper
  // (\`Box onClick={() => openDrawer()}\`), which opens the bottom sheet exactly as a real user tap would.
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('button');
    await userEvent.click(trigger);
  }
}`,...(d=t.parameters)===null||d===void 0||(p=d.docs)===null||p===void 0?void 0:p.source}}};const we=["Default","LocaleStress","MobileBottomSheet"];export{e as Default,o as LocaleStress,t as MobileBottomSheet,we as __namedExportsOrder,he as default};
