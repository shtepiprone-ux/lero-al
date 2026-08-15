import{j as e}from"./iframe-BWqC60Cj.js";import{s as h}from"./_storyI18n-DUPbxmag.js";import{M as u}from"./_MantineStoryShell-v1yXHo2n.js";import{S as l}from"./Stack-DqzY2ynC.js";import{T as a}from"./Text-ZiglToyN.js";import{T as t}from"./TextInput-C4SGdSHD.js";import"./preload-helper-Dp1pzeXC.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";var d,c,p;const v={title:"Mantine/Primitives/TextInput",parameters:{skipCanvas:!0,layout:"fullscreen"}},o={render:(_,i)=>{var s,n;const x=(n=i==null||(s=i.globals)===null||s===void 0?void 0:s.locale)!==null&&n!==void 0?n:"en",r=b=>h(x,`storybook.mantine.${b}`);return e.jsx(u,{children:e.jsxs(l,{gap:"xl",children:[e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"basic — gray-2 border / gray-4 placeholder / gray-8 text / shadow-xs / brand focus / required = no asterisk"}),e.jsx(t,{label:r("label_email"),placeholder:r("ti_placeholder"),required:!0})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"label + description — hint renders BELOW the input (inputWrapperOrder: label/input/description/error)"}),e.jsx(t,{label:r("label_job_title"),placeholder:r("label_job_placeholder"),description:r("label_job_hint")})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"optional — quiet (optional) suffix + placeholder + description-below (owner reference pattern)"}),e.jsx(t,{label:e.jsxs(e.Fragment,{children:[r("label_job_title")," ",e.jsx(a,{span:!0,c:"gray.5",fz:"sm",fw:400,children:r("label_optional")})]}),placeholder:r("label_job_placeholder"),description:r("label_job_hint")})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"error — red border + red message text + aria-invalid; label unchanged"}),e.jsx(t,{label:r("label_email"),placeholder:r("ti_placeholder"),required:!0,error:r("ti_error")})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"disabled — dimmed input + dimmed label; no focus ring; no pointer"}),e.jsx(t,{label:r("label_email"),placeholder:r("ti_placeholder"),disabled:!0})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"long label — wraps to ≥2 lines at 320; no clip; no h-scroll at any locale (sq/en/uk/it)"}),e.jsx(t,{label:r("label_long"),placeholder:r("ti_name_placeholder")})]})]})})}};o.parameters={...o.parameters,docs:{...(d=o.parameters)===null||d===void 0?void 0:d.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* ── basic — resting chrome + required (no asterisk) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              basic — gray-2 border / gray-4 placeholder / gray-8 text / shadow-xs / brand focus / required = no asterisk\r
            </Text>\r
            <TextInput label={t('label_email')} placeholder={t('ti_placeholder')} required />\r
          </Stack>\r
\r
          {/* ── label + description — hint renders BELOW the input ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              label + description — hint renders BELOW the input (inputWrapperOrder: label/input/description/error)\r
            </Text>\r
            <TextInput label={t('label_job_title')} placeholder={t('label_job_placeholder')} description={t('label_job_hint')} />\r
          </Stack>\r
\r
          {/* ── optional — (optional) suffix + placeholder + description below ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              optional — quiet (optional) suffix + placeholder + description-below (owner reference pattern)\r
            </Text>\r
            <TextInput label={<>\r
                  {t('label_job_title')}{' '}\r
                  <Text span c="gray.5" fz="sm" fw={400}>{t('label_optional')}</Text>\r
                </>} placeholder={t('label_job_placeholder')} description={t('label_job_hint')} />\r
          </Stack>\r
\r
          {/* ── error — red border + red message + aria-invalid (negative flow) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — red border + red message text + aria-invalid; label unchanged\r
            </Text>\r
            <TextInput label={t('label_email')} placeholder={t('ti_placeholder')} required error={t('ti_error')} />\r
          </Stack>\r
\r
          {/* ── disabled — dimmed input + dimmed label (negative flow) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — dimmed input + dimmed label; no focus ring; no pointer\r
            </Text>\r
            <TextInput label={t('label_email')} placeholder={t('ti_placeholder')} disabled />\r
          </Stack>\r
\r
          {/* ── long label (negative flow) — wraps ≥2 lines at 320; no clip; no h-scroll ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long label — wraps to ≥2 lines at 320; no clip; no h-scroll at any locale (sq/en/uk/it)\r
            </Text>\r
            <TextInput label={t('label_long')} placeholder={t('ti_name_placeholder')} />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(p=o.parameters)===null||p===void 0||(c=p.docs)===null||c===void 0?void 0:c.source}}};const z=["Default"];export{o as Default,z as __namedExportsOrder,v as default};
