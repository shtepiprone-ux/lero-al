import{j as e,r as c}from"./iframe-BWqC60Cj.js";import{s as x}from"./_storyI18n-DUPbxmag.js";import{L as g}from"./LocationCombobox-CwBJ8xxh.js";import{M as h}from"./_MantineStoryShell-v1yXHo2n.js";import{S as b}from"./Stack-DqzY2ynC.js";import{T as f}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";var m,p,d;const xo={title:"Mantine/Primitives/LocationComboboxSubPanel",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title deliberately placed under `Mantine/Primitives/` (Task 554, gate-phase decision): the\r\nrendered-assert harness (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing\r\nenforcement to stories whose title matches this exact prefix (Phase 0, `discoverMantinePrimitiveStories`,\r\nruns unconditionally incl. `--mantine-only`). `LocationCombobox` is a composite, not a primitive —\r\nthis title is a display-grouping choice for enforcement, not a taxonomy claim; noted here and in\r\nthe session log, not silently done."}}}};function y({locations:u,regions:i,placeholder:r}){const[n,l]=c.useState(""),t=c.useRef(null);return c.useLayoutEffect(()=>{var o,a;(a=t.current)===null||a===void 0||(o=a.querySelector("button"))===null||o===void 0||o.click()},[]),e.jsx("div",{ref:t,style:{maxWidth:420},children:e.jsx(g,{locations:u,value:n,onChange:o=>l(o??""),placeholder:r,regions:i,onAddLocation:async()=>({id:999})})})}const s={render:(u,i)=>{var r,n;const l=(n=i==null||(r=i.globals)===null||r===void 0?void 0:r.locale)!==null&&n!==void 0?n:"en",t=_=>x(l,`storybook.mantine.${_}`),o=[{id:1,name_al:t("combobox_option_tirana"),type:"city"},{id:2,name_al:t("combobox_option_durres"),type:"city"}],a=[{id:10,name_al:t("location_combobox_region_north")},{id:11,name_al:t("location_combobox_region_south")}];return e.jsx(h,{children:e.jsx(b,{gap:"xl",children:e.jsxs(b,{gap:"xs",children:[e.jsx(f,{size:"xs",c:"gray.5",fw:500,children:"add-location sub-panel — forced open (real `LocationCombobox`, real primitives); toggle is the ONE compact/fit-content exemption (§6s), everything else below it is full-width <640"}),e.jsx(y,{locations:o,regions:a,placeholder:t("combobox_clear_label")})]})})})}};s.parameters={...s.parameters,docs:{...(m=s.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    const locations: LocationOption[] = [{
      id: 1,
      name_al: t('combobox_option_tirana'),
      type: 'city'
    }, {
      id: 2,
      name_al: t('combobox_option_durres'),
      type: 'city'
    }];
    const regions: RegionOption[] = [{
      id: 10,
      name_al: t('location_combobox_region_north')
    }, {
      id: 11,
      name_al: t('location_combobox_region_south')
    }];
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          {/* 1 — add-location sub-panel forced OPEN (Task 554): toggle Anchor (§6s, compact\r
              fit-content exemption, ≥44px touch height) + TextInput + region MantineCombobox\r
              (variant="button", full-width) + Add/Cancel Buttons (full-width <640, row ≥640).\r
              Add stays disabled until both name + region are set (same guard as production). */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              add-location sub-panel — forced open (real \`LocationCombobox\`, real primitives); toggle\r
              is the ONE compact/fit-content exemption (§6s), everything else below it is full-width\r
              &lt;640\r
            </Text>\r
            <LocationComboboxOpenSubPanel locations={locations} regions={regions} placeholder={t('combobox_clear_label')} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(d=s.parameters)===null||d===void 0||(p=d.docs)===null||p===void 0?void 0:p.source}}};const go=["Default"];export{s as Default,go as __namedExportsOrder,xo as default};
