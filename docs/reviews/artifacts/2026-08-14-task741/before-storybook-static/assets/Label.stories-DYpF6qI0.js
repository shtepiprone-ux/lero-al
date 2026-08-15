import{j as e}from"./iframe-BWqC60Cj.js";import{s as u}from"./_storyI18n-DUPbxmag.js";import{M as g}from"./_MantineStoryShell-v1yXHo2n.js";import{S as l}from"./Stack-DqzY2ynC.js";import{T as a}from"./Text-ZiglToyN.js";import{T as t}from"./TextInput-C4SGdSHD.js";import"./preload-helper-Dp1pzeXC.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";var c,d,p;const S={title:"Mantine/Primitives/Label",parameters:{skipCanvas:!0,layout:"fullscreen"}},s={render:(m,o)=>{var i,n;const x=(n=o==null||(i=o.globals)===null||i===void 0?void 0:i.locale)!==null&&n!==void 0?n:"en",r=b=>u(x,`storybook.mantine.${b}`);return e.jsx(g,{children:e.jsxs(l,{gap:"xl",children:[e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"required (default) — 14px/fw500/gray-7 label; no asterisk even when required prop is set"}),e.jsx(t,{label:r("label_email"),required:!0})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"optional — label + quieter suffix + placeholder + 12px gray-5 description hint (owner reference)"}),e.jsx(t,{label:e.jsxs(e.Fragment,{children:[r("label_job_title")," ",e.jsx(a,{span:!0,c:"gray.5",fz:"sm",fw:400,children:r("label_optional")})]}),placeholder:r("label_job_placeholder"),description:r("label_job_hint")})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"long label — wraps to ≥2 lines at 320; no clip; no h-scroll (sq/en/uk/it)"}),e.jsx(t,{label:r("label_long")})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"disabled — label dimmed consistently with input; no bright label over greyed field"}),e.jsx(t,{label:r("label_email"),disabled:!0})]})]})})}};s.parameters={...s.parameters,docs:{...(c=s.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* ── Required (default, no asterisk) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              required (default) — 14px/fw500/gray-7 label; no asterisk even when required prop is set\r
            </Text>\r
            <TextInput label={t('label_email')} required />\r
          </Stack>\r
\r
          {/* ── Optional (marked, full reference pattern) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              optional — label + quieter suffix + placeholder + 12px gray-5 description hint (owner reference)\r
            </Text>\r
            <TextInput label={<>{t('label_job_title')} <Text span c="gray.5" fz="sm" fw={400}>{t('label_optional')}</Text></>} placeholder={t('label_job_placeholder')} description={t('label_job_hint')} />\r
          </Stack>\r
\r
          {/* ── Long label wrap (negative) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long label — wraps to ≥2 lines at 320; no clip; no h-scroll (sq/en/uk/it)\r
            </Text>\r
            <TextInput label={t('label_long')} />\r
          </Stack>\r
\r
          {/* ── Disabled control (negative) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — label dimmed consistently with input; no bright label over greyed field\r
            </Text>\r
            <TextInput label={t('label_email')} disabled />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(p=s.parameters)===null||p===void 0||(d=p.docs)===null||d===void 0?void 0:d.source}}};const q=["Default"];export{s as Default,q as __namedExportsOrder,S as default};
