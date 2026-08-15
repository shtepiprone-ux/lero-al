import{j as e}from"./iframe-BWqC60Cj.js";import{s as m}from"./_storyI18n-DUPbxmag.js";import{M as g}from"./_MantineStoryShell-v1yXHo2n.js";import{S as a}from"./Stack-DqzY2ynC.js";import{T as t}from"./Text-ZiglToyN.js";import{T as l}from"./Textarea-lEE62Y6x.js";import"./preload-helper-Dp1pzeXC.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";var d,c,p;const j={title:"Mantine/Primitives/Textarea",parameters:{skipCanvas:!0,layout:"fullscreen"}},o={render:(b,s)=>{var i,n;const x=(n=s==null||(i=s.globals)===null||i===void 0?void 0:i.locale)!==null&&n!==void 0?n:"en",r=u=>m(x,`storybook.mantine.${u}`);return e.jsx(g,{children:e.jsxs(a,{gap:"xl",children:[e.jsxs(a,{gap:"xs",children:[e.jsx(t,{size:"xs",c:"gray.5",fw:500,children:"basic — gray-2 border / gray-4 placeholder / gray-8 text / shadow-xs / brand focus / description below"}),e.jsx(l,{label:r("ta_label"),placeholder:r("ta_placeholder"),description:r("ta_hint"),autosize:!0,minRows:3})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(t,{size:"xs",c:"gray.5",fw:500,children:"autosize — grows with content; long uk wraps ≥2 lines at 320; no clip; no h-scroll"}),e.jsx(l,{label:r("ta_label"),defaultValue:r("ta_long_value"),autosize:!0,minRows:3})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(t,{size:"xs",c:"gray.5",fw:500,children:"error — red border + red message text + aria-invalid; label unchanged"}),e.jsx(l,{label:r("ta_label"),placeholder:r("ta_placeholder"),error:r("ta_error"),autosize:!0,minRows:3})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(t,{size:"xs",c:"gray.5",fw:500,children:"disabled — dimmed input + dimmed label; no focus ring; no pointer"}),e.jsx(l,{label:r("ta_label"),placeholder:r("ta_placeholder"),disabled:!0,autosize:!0,minRows:3})]})]})})}};o.parameters={...o.parameters,docs:{...(d=o.parameters)===null||d===void 0?void 0:d.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* ── basic — resting chrome + description below (inputWrapperOrder) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              basic — gray-2 border / gray-4 placeholder / gray-8 text / shadow-xs / brand focus / description below\r
            </Text>\r
            <Textarea label={t('ta_label')} placeholder={t('ta_placeholder')} description={t('ta_hint')} autosize minRows={3} />\r
          </Stack>\r
\r
          {/* ── autosize / long content — grows with content; uk wraps ≥2 lines at 320 ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              autosize — grows with content; long uk wraps ≥2 lines at 320; no clip; no h-scroll\r
            </Text>\r
            <Textarea label={t('ta_label')} defaultValue={t('ta_long_value')} autosize minRows={3} />\r
          </Stack>\r
\r
          {/* ── error — red border + red message + aria-invalid (negative flow) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — red border + red message text + aria-invalid; label unchanged\r
            </Text>\r
            <Textarea label={t('ta_label')} placeholder={t('ta_placeholder')} error={t('ta_error')} autosize minRows={3} />\r
          </Stack>\r
\r
          {/* ── disabled — dimmed input + dimmed label (negative flow) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — dimmed input + dimmed label; no focus ring; no pointer\r
            </Text>\r
            <Textarea label={t('ta_label')} placeholder={t('ta_placeholder')} disabled autosize minRows={3} />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(p=o.parameters)===null||p===void 0||(c=p.docs)===null||c===void 0?void 0:c.source}}};const R=["Default"];export{o as Default,R as __namedExportsOrder,j as default};
