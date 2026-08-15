import{j as r,r as g}from"./iframe-BWqC60Cj.js";import{s as u}from"./_storyI18n-DUPbxmag.js";import{P as h}from"./PhoneField-BC8iARsx.js";import{M as f}from"./_MantineStoryShell-v1yXHo2n.js";import{S as n}from"./Stack-DqzY2ynC.js";import{T as d}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";var l,s,p;const gr={title:"Mantine/Primitives/PhoneField",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title under `Mantine/Primitives/` (Task 556, following the Task 554 precedent): the\r\nrendered-assert harness (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing\r\nenforcement under `--mantine-only` to stories whose title matches this exact prefix. `PhoneField`\r\nis a composite (country `MantineCombobox` + national `TextInput`), not a primitive — this title\r\nis a display-grouping choice for gate enforcement, not a taxonomy claim."}}}};function y({label:i}){const[e,t]=g.useState({national:"691234567",dialCode:"+355",iso2:"AL",e164:"+355691234567"});return r.jsx(h,{value:e.e164,onChange:t,label:i})}function v({label:i,error:e}){const[t,o]=g.useState({national:"123",dialCode:"+355",iso2:"AL",e164:"+355123"});return r.jsx(h,{value:t.e164,onChange:o,label:i,error:e})}const a={render:(i,e)=>{var t,o;const m=(o=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en",c=u(m,"storybook.input.phone"),x=u(m,"auth.error_phone_invalid");return r.jsx(f,{children:r.jsxs(n,{gap:"xl",children:[r.jsxs(n,{gap:"xs",children:[r.jsx(d,{size:"xs",c:"gray.5",fw:500,children:"default — country trigger (compact §15-aligned) + national input (flex-1, full-width row <640)"}),r.jsx(y,{label:c})]}),r.jsxs(n,{gap:"xs",children:[r.jsx(d,{size:"xs",c:"gray.5",fw:500,children:"error — §6e red border + wrapped message on the national input; country trigger unaffected"}),r.jsx(v,{label:c,error:x})]})]})})}};a.parameters={...a.parameters,docs:{...(l=a.parameters)===null||l===void 0?void 0:l.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const label = storyT(locale, 'storybook.input.phone');
    const error = storyT(locale, 'auth.error_phone_invalid');
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          {/* 1 — default: country trigger (compact, ~7rem — the ONE full-width exemption, §15\r
              height-aligned with the national input) + national TextInput (flex-1, full-bleed) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              default — country trigger (compact §15-aligned) + national input (flex-1, full-width\r
              row &lt;640)\r
            </Text>\r
            <DefaultDemo label={label} />\r
          </Stack>\r
\r
          {/* 2 — error: §6e red border + message on the national TextInput only; country trigger\r
              unaffected (the error is about the number, not the country) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — §6e red border + wrapped message on the national input; country trigger\r
              unaffected\r
            </Text>\r
            <ErrorDemo label={label} error={error} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(p=a.parameters)===null||p===void 0||(s=p.docs)===null||s===void 0?void 0:s.source}}};const hr=["Default"];export{a as Default,hr as __namedExportsOrder,gr as default};
