import{j as e,r as h}from"./iframe-BWqC60Cj.js";import{s as v}from"./_storyI18n-DUPbxmag.js";import{R as w}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as b}from"./_MantineStoryShell-v1yXHo2n.js";import{S as i}from"./Stack-DqzY2ynC.js";import{T as d}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var x,f,y;const xe={title:"Mantine/Primitives/RangeDatePicker",parameters:{skipCanvas:!0,layout:"fullscreen"}};function D({value:n,maxDate:a,disablePastDates:t,placeholder:o}){const[s,r]=h.useState(n),l=h.useRef(null);return h.useEffect(()=>{const p=setTimeout(()=>{var c,u;(u=l.current)===null||u===void 0||(c=u.querySelector("input"))===null||c===void 0||c.click()},0);return()=>clearTimeout(p)},[]),e.jsx("div",{ref:l,style:{maxWidth:480},children:e.jsx(w,{value:s,onChange:r,maxDate:a,disablePastDates:t,placeholder:o})})}const m={render:(n,a)=>{var t,o;const s=(o=a==null||(t=a.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en",r=c=>v(s,`storybook.mantine.${c}`),l={from:"2026-01-28",to:"2026-02-05"},p=new Date(2026,1,10);return e.jsx(b,{children:e.jsxs(i,{gap:"xl",children:[e.jsxs(i,{gap:"xs",children:[e.jsx(d,{size:"xs",c:"gray.5",fw:500,children:"empty — trigger shows placeholder, no clear affordance"}),e.jsx(g,{placeholder:r("range_placeholder")})]}),e.jsxs(i,{gap:"xs",children:[e.jsx(d,{size:"xs",c:"gray.5",fw:500,children:"staged range spanning two months — trigger shows dd.MM.yyyy — dd.MM.yyyy + clear-X"}),e.jsx(g,{value:l,placeholder:r("range_placeholder")})]}),e.jsxs(i,{gap:"xs",children:[e.jsx(d,{size:"xs",c:"gray.5",fw:500,children:"maxDate-bounded — prop accepted, trigger unaffected while closed"}),e.jsx(g,{maxDate:p,placeholder:r("range_placeholder")})]}),e.jsxs(i,{gap:"xs",children:[e.jsx(d,{size:"xs",c:"gray.5",fw:500,children:"disablePastDates — prop accepted, trigger unaffected while closed (forcing this OPEN too, alongside the section below, made two floating panels collide on screen — a story-layout artifact confirmed via a rendered-gate probe, not a component defect; see the session log's Rendered evidence for an isolated open capture of this prop)"}),e.jsx(g,{disablePastDates:!0,placeholder:r("range_placeholder")})]}),e.jsxs(i,{gap:"xs",children:[e.jsx(d,{size:"xs",c:"gray.5",fw:500,children:"forced open (real RangeDatePicker, Task 561 mobile rework) — ≥640: two-month consecutive pair + shared header (arrows + month/year dropdowns + gray right-month label) + range summary + Clear/Cancel/Apply; <640: FIXED header with month + year dropdowns (no duplicate month label), vertically-scrolling month list where each section is Title → Monday-first weekday row → 39px day grid, and a FIXED bottom bar (range summary + full-width Confirm) that does not scroll with the list. inRange fill + maxDate disabled tail both visible. ONE forced-open instance only — a second simultaneous one was tried and reverted (see the row above)."}),e.jsx(D,{value:l,maxDate:p,placeholder:r("range_placeholder")})]})]})})}};function g({value:n,maxDate:a,disablePastDates:t,placeholder:o}){const[s,r]=h.useState(n??{from:void 0,to:void 0});return e.jsx("div",{style:{maxWidth:480},children:e.jsx(w,{value:s,onChange:r,maxDate:a,disablePastDates:t,placeholder:o})})}m.parameters={...m.parameters,docs:{...(x=m.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);

    // Fixed dates (no Math.random()/new Date() wall-clock in fixtures per Storybook governance §14) —
    // '2026-01-28' → '2026-02-05' spans a month boundary so the inRange fill's cross-month
    // continuity is visible; maxDate mid-February disables the tail of the right/Feb month grid.
    const spanningRange: DateRange = {
      from: '2026-01-28',
      to: '2026-02-05'
    };
    const boundedMaxDate = new Date(2026, 1, 10);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              empty — trigger shows placeholder, no clear affordance\r
            </Text>\r
            <RangeDatePickerRow placeholder={t('range_placeholder')} />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              staged range spanning two months — trigger shows dd.MM.yyyy — dd.MM.yyyy + clear-X\r
            </Text>\r
            <RangeDatePickerRow value={spanningRange} placeholder={t('range_placeholder')} />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              maxDate-bounded — prop accepted, trigger unaffected while closed\r
            </Text>\r
            <RangeDatePickerRow maxDate={boundedMaxDate} placeholder={t('range_placeholder')} />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disablePastDates — prop accepted, trigger unaffected while closed (forcing this OPEN\r
              too, alongside the section below, made two floating panels collide on screen — a\r
              story-layout artifact confirmed via a rendered-gate probe, not a component defect;\r
              see the session log&apos;s Rendered evidence for an isolated open capture of this prop)\r
            </Text>\r
            <RangeDatePickerRow disablePastDates placeholder={t('range_placeholder')} />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              forced open (real RangeDatePicker, Task 561 mobile rework) — ≥640: two-month\r
              consecutive pair + shared header (arrows + month/year dropdowns + gray right-month\r
              label) + range summary + Clear/Cancel/Apply; &lt;640: FIXED header with month + year\r
              dropdowns (no duplicate month label), vertically-scrolling month list where each\r
              section is Title → Monday-first weekday row → 39px day grid, and a FIXED bottom bar\r
              (range summary + full-width Confirm) that does not scroll with the list. inRange fill\r
              + maxDate disabled tail both visible. ONE forced-open instance only — a second\r
              simultaneous one was tried and reverted (see the row above).\r
            </Text>\r
            <RangeDatePickerOpen value={spanningRange} maxDate={boundedMaxDate} placeholder={t('range_placeholder')} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(y=m.parameters)===null||y===void 0||(f=y.docs)===null||f===void 0?void 0:f.source}}};const fe=["Default"];export{m as Default,fe as __namedExportsOrder,xe as default};
