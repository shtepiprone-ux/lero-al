import{j as e}from"./iframe-BWqC60Cj.js";import{s as m}from"./_storyI18n-DUPbxmag.js";import{j as a}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as b}from"./_MantineStoryShell-v1yXHo2n.js";import{S as l}from"./Stack-DqzY2ynC.js";import{T as s}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var n,g,u;const ge={title:"Mantine/Primitives/Progress",parameters:{skipCanvas:!0,layout:"fullscreen"}},t={render:(v,o)=>{var i,p;const c=(p=o==null||(i=o.globals)===null||i===void 0?void 0:i.locale)!==null&&p!==void 0?p:"en",r=x=>m(c,`storybook.mantine.${x}`);return e.jsx(b,{children:e.jsxs(l,{gap:"xl",children:[e.jsxs(l,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"resting (bare) — §6 Progress: gray-200 pill track / brand fill, aria-label only (no visible label)"}),e.jsx(a,{value:45,"aria-label":r("progress_label_storage")})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"label + value — label left / value right, above the bar; both update with value"}),e.jsx(a,{value:72,label:r("progress_label_storage"),showValue:!0})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"sizes — sm=8px / md=12px (default) / lg=16px / xl=20px"}),e.jsxs(l,{gap:"sm",children:[e.jsx(a,{value:30,size:"sm","aria-label":`${r("progress_label_storage")} sm`}),e.jsx(a,{value:30,size:"md","aria-label":`${r("progress_label_storage")} md`}),e.jsx(a,{value:30,size:"lg","aria-label":`${r("progress_label_storage")} lg`}),e.jsx(a,{value:30,size:"xl","aria-label":`${r("progress_label_storage")} xl`})]})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"transition (two values) — fill grows from value to value; static snapshots at 20% and 80%"}),e.jsxs(l,{gap:"sm",children:[e.jsx(a,{value:20,label:r("progress_label_upload"),showValue:!0}),e.jsx(a,{value:80,label:r("progress_label_upload"),showValue:!0})]})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"value=0 — empty track, no visible fill, no crash"}),e.jsx(a,{value:0,label:r("progress_label_upload"),showValue:!0})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"value=100 — track fully filled"}),e.jsx(a,{value:100,label:r("progress_label_upload"),showValue:!0})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"out-of-range (value=150 and value=-30) — clamped to [0,100], no overflow past the track"}),e.jsxs(l,{gap:"sm",children:[e.jsx(a,{value:150,label:r("progress_label_upload"),showValue:!0}),e.jsx(a,{value:-30,label:r("progress_label_upload"),showValue:!0})]})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"long label — wraps in the label row, never clips, no h-scroll at 320"}),e.jsx(a,{value:55,label:r("progress_label_long"),showValue:!0})]})]})})}};t.parameters={...t.parameters,docs:{...(n=t.parameters)===null||n===void 0?void 0:n.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — resting: §6 Progress row — gray-200 pill track, brand fill, no label */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              resting (bare) — §6 Progress: gray-200 pill track / brand fill, aria-label only (no visible label)\r
            </Text>\r
            <MantineProgress value={45} aria-label={t('progress_label_storage')} />\r
          </Stack>\r
\r
          {/* 2 — with label + value: label left, value right, above the bar */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              label + value — label left / value right, above the bar; both update with value\r
            </Text>\r
            <MantineProgress value={72} label={t('progress_label_storage')} showValue />\r
          </Stack>\r
\r
          {/* 3 — sizes sm/md/lg/xl — 8/12/16/20px track+fill height */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              sizes — sm=8px / md=12px (default) / lg=16px / xl=20px\r
            </Text>\r
            <Stack gap="sm">\r
              <MantineProgress value={30} size="sm" aria-label={\`\${t('progress_label_storage')} sm\`} />\r
              <MantineProgress value={30} size="md" aria-label={\`\${t('progress_label_storage')} md\`} />\r
              <MantineProgress value={30} size="lg" aria-label={\`\${t('progress_label_storage')} lg\`} />\r
              <MantineProgress value={30} size="xl" aria-label={\`\${t('progress_label_storage')} xl\`} />\r
            </Stack>\r
          </Stack>\r
\r
          {/* 4 — transition: two static values side by side (0→X fill), proves the same component\r
              renders correctly at both ends of its range, not just one snapshot */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              transition (two values) — fill grows from value to value; static snapshots at 20% and 80%\r
            </Text>\r
            <Stack gap="sm">\r
              <MantineProgress value={20} label={t('progress_label_upload')} showValue />\r
              <MantineProgress value={80} label={t('progress_label_upload')} showValue />\r
            </Stack>\r
          </Stack>\r
\r
          {/* 5 — negative: value=0 → empty track, no crash */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              value=0 — empty track, no visible fill, no crash\r
            </Text>\r
            <MantineProgress value={0} label={t('progress_label_upload')} showValue />\r
          </Stack>\r
\r
          {/* 6 — negative: value=100 → fully filled */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              value=100 — track fully filled\r
            </Text>\r
            <MantineProgress value={100} label={t('progress_label_upload')} showValue />\r
          </Stack>\r
\r
          {/* 7 — negative: out-of-range clamped to [0,100], no overflow past the track */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              out-of-range (value=150 and value=-30) — clamped to [0,100], no overflow past the track\r
            </Text>\r
            <Stack gap="sm">\r
              <MantineProgress value={150} label={t('progress_label_upload')} showValue />\r
              <MantineProgress value={-30} label={t('progress_label_upload')} showValue />\r
            </Stack>\r
          </Stack>\r
\r
          {/* 8 — negative: long sq/uk/it label wraps, never clips, no h-scroll at 320 */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long label — wraps in the label row, never clips, no h-scroll at 320\r
            </Text>\r
            <MantineProgress value={55} label={t('progress_label_long')} showValue />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(u=t.parameters)===null||u===void 0||(g=u.docs)===null||g===void 0?void 0:g.source}}};const ue=["Default"];export{t as Default,ue as __namedExportsOrder,ge as default};
