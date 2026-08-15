import{j as e}from"./iframe-BWqC60Cj.js";import{h as o}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{s as v}from"./_storyI18n-DUPbxmag.js";import{M as h}from"./_MantineStoryShell-v1yXHo2n.js";import{S as a}from"./Stack-DqzY2ynC.js";import{T as s}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var x,d,b;const xe={title:"Mantine/Primitives/Pagination",parameters:{skipCanvas:!0,layout:"fullscreen"}},l={render:(L,n)=>{var p,g;const u=(g=n==null||(p=n.globals)===null||p===void 0?void 0:p.locale)!==null&&g!==void 0?g:"en",c=m=>v(u,`storybook.mantine.${m}`),t=c("pagination_aria_prev"),r=c("pagination_aria_next"),i=m=>c("pagination_aria_page").replace("{page}",String(m));return e.jsx(h,{children:e.jsxs(a,{gap:"xl",children:[e.jsxs(a,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"default — total=10, value=5 — transparent inactive / brand active / white prev-next w/ gray-300 border"}),e.jsx(o,{total:10,value:5,onChange:()=>{},previousLabel:t,nextLabel:r,getPageAriaLabel:i})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"mobile-compact — total=50, value=25, size=sm — single-line shed-to-fit, no h-scroll@320"}),e.jsx(o,{total:50,value:25,onChange:()=>{},size:"sm",previousLabel:t,nextLabel:r,getPageAriaLabel:i})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"shed-ladder stress — total=250, value=137, size=sm — asymmetric shed at narrow widths"}),e.jsx(o,{total:250,value:137,onChange:()=>{},size:"sm",previousLabel:t,nextLabel:r,getPageAriaLabel:i})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"boundary — page 1, Prev disabled"}),e.jsx(o,{total:10,value:1,onChange:()=>{},previousLabel:t,nextLabel:r,getPageAriaLabel:i})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"boundary — last page, Next disabled"}),e.jsx(o,{total:10,value:10,onChange:()=>{},previousLabel:t,nextLabel:r,getPageAriaLabel:i})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"single page — total=1, no crash"}),e.jsx(o,{total:1,value:1,onChange:()=>{},previousLabel:t,nextLabel:r,getPageAriaLabel:i})]})]})})}};l.parameters={...l.parameters,docs:{...(x=l.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    const previousLabel = t('pagination_aria_prev');
    const nextLabel = t('pagination_aria_next');
    const getPageAriaLabel = (page: number) => t('pagination_aria_page').replace('{page}', String(page));
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* ── default cluster — moderate total, inactive + active + prev/next + dots ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              default — total=10, value=5 — transparent inactive / brand active / white prev-next w/ gray-300 border\r
            </Text>\r
            <MantinePagination total={10} value={5} onChange={() => {}} previousLabel={previousLabel} nextLabel={nextLabel} getPageAriaLabel={getPageAriaLabel} />\r
          </Stack>\r
\r
          {/* ── mobile-compact cluster — negative flow: single-line, no-wrap, no h-scroll@320 ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              mobile-compact — total=50, value=25, size=sm — single-line shed-to-fit, no h-scroll@320\r
            </Text>\r
            <MantinePagination total={50} value={25} onChange={() => {}} size="sm" previousLabel={previousLabel} nextLabel={nextLabel} getPageAriaLabel={getPageAriaLabel} />\r
          </Stack>\r
\r
          {/* ── shed-ladder stress — very long total, mid-range page, exercises the full ladder ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              shed-ladder stress — total=250, value=137, size=sm — asymmetric shed at narrow widths\r
            </Text>\r
            <MantinePagination total={250} value={137} onChange={() => {}} size="sm" previousLabel={previousLabel} nextLabel={nextLabel} getPageAriaLabel={getPageAriaLabel} />\r
          </Stack>\r
\r
          {/* ── boundary — page 1, Prev disabled ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              boundary — page 1, Prev disabled\r
            </Text>\r
            <MantinePagination total={10} value={1} onChange={() => {}} previousLabel={previousLabel} nextLabel={nextLabel} getPageAriaLabel={getPageAriaLabel} />\r
          </Stack>\r
\r
          {/* ── boundary — last page, Next disabled ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              boundary — last page, Next disabled\r
            </Text>\r
            <MantinePagination total={10} value={10} onChange={() => {}} previousLabel={previousLabel} nextLabel={nextLabel} getPageAriaLabel={getPageAriaLabel} />\r
          </Stack>\r
\r
          {/* ── single page — negative flow: no crash, minimal render ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              single page — total=1, no crash\r
            </Text>\r
            <MantinePagination total={1} value={1} onChange={() => {}} previousLabel={previousLabel} nextLabel={nextLabel} getPageAriaLabel={getPageAriaLabel} />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(b=l.parameters)===null||b===void 0||(d=b.docs)===null||d===void 0?void 0:d.source}}};const de=["Default"];export{l as Default,de as __namedExportsOrder,xe as default};
