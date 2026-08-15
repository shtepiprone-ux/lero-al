import{j as o,r as h}from"./iframe-BWqC60Cj.js";import{s as w}from"./_storyI18n-DUPbxmag.js";import{a as _}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as v}from"./_MantineStoryShell-v1yXHo2n.js";import{S as r}from"./Stack-DqzY2ynC.js";import{T as s}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var m,u,x;const _e={title:"Mantine/Primitives/Combobox",parameters:{skipCanvas:!0,layout:"fullscreen"}};function n({options:c,...l}){const[i,a]=h.useState("");return o.jsx(_,{options:c,value:i,onChange:a,...l})}function y({options:c,...l}){const[i,a]=h.useState("");return o.jsx(_,{options:c,value:i,onChange:a,onInputChange:p=>{const e=p.replace(/\D/g,"").slice(0,4),t=c.find(b=>b.value===e);a(t?t.value:"")},inputMode:"numeric",variant:"input",...l})}function k({options:c,firedLabel:l,...i}){const[a,p]=h.useState(""),[e,t]=h.useState(!1);return o.jsxs(r,{gap:"xs",children:[o.jsx(_,{options:c,value:a,onChange:p,onKeyDown:b=>{b.key==="Enter"&&t(!0)},...i}),e&&o.jsx(s,{size:"xs",c:"brand.7",fw:500,children:l})]})}const d={render:(c,l)=>{var i,a;const p=(a=l==null||(i=l.globals)===null||i===void 0?void 0:i.locale)!==null&&a!==void 0?a:"en",e=b=>w(p,`storybook.mantine.${b}`),t=[{value:"tirana",label:e("combobox_option_tirana")},{value:"durres",label:e("combobox_option_durres")},{value:"vlore",label:e("combobox_option_vlore")},{value:"shkoder",label:e("combobox_option_shkoder")},{value:"saranda",label:e("combobox_option_saranda"),description:e("combobox_option_saranda_desc")},{value:"long",label:e("combobox_option_long")}];return o.jsx(v,{children:o.jsxs(r,{gap:"xl",children:[o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:'variant="input" resting — §6d/§6e chrome; type to filter (desktop) or tap to open the sheet (mobile, own search field); ≥640 anchored dropdown, <640 full-width bottom sheet'}),o.jsx(n,{options:t,variant:"input",placeholder:e("combobox_placeholder"),clearLabel:e("combobox_clear_label"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title")})]}),o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:'variant="button" + searchable — compact trigger; search field renders INSIDE the dropdown/sheet, not on the trigger; trigger label stays put while filtering'}),o.jsx(n,{options:t,variant:"button",searchable:!0,placeholder:e("combobox_placeholder"),searchPlaceholder:e("combobox_search_placeholder"),triggerAriaLabel:e("combobox_trigger_aria"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title")})]}),o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:'variant="button" (no search) — compact trigger; static list, no search field anywhere'}),o.jsx(n,{options:t,variant:"button",placeholder:e("combobox_placeholder"),triggerAriaLabel:e("combobox_trigger_aria"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title")})]}),o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"error — red-6 border / no shadow; message renders below in red; label color does NOT turn red (§6e)"}),o.jsx(n,{options:t,variant:"input",placeholder:e("combobox_placeholder"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title"),error:e("combobox_error")})]}),o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"disabled — whole control faded (label + field + chevron → opacity 0.5); tap/type does NOT open the dropdown/sheet at any width"}),o.jsx(n,{options:t,variant:"input",placeholder:e("combobox_placeholder"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title"),disabled:!0})]}),o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:'empty options — immediate "no results" row, no crash; sheet/dropdown still opens and closes normally'}),o.jsx(n,{options:[],variant:"input",placeholder:e("combobox_placeholder"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title")})]}),o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"long label (§7) — long sq/uk/it option text wraps in the dropdown/sheet row; no clip, no h-scroll at 320"}),o.jsx(n,{options:t,variant:"input",placeholder:e("combobox_placeholder"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title")})]}),o.jsxs(r,{gap:"xs",children:[o.jsxs(s,{size:"xs",c:"gray.5",fw:500,children:["triggerWidth override — `","{ base: '100%', sm: '100%' }","` keeps the trigger at the wrapper's full width on desktop too (default, when the prop is omitted, is content-width `sm:auto` — see block 3 above)"]}),o.jsx(n,{options:t,variant:"button",placeholder:e("combobox_placeholder"),triggerAriaLabel:e("combobox_trigger_aria"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title"),triggerWidth:{base:"100%",sm:"100%"}})]}),o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:'numeric typeahead — `onInputChange` + `inputMode="numeric"`; typing a full valid year live-commits it without opening the dropdown/sheet (mobile keypad is numeric); selecting from the list still works'}),o.jsx(y,{options:Array.from({length:9},(b,f)=>{const g=2018+f;return{value:String(g),label:String(g)}}),placeholder:e("combobox_numeric_placeholder"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title")})]}),o.jsxs(r,{gap:"xs",children:[o.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"onKeyDown Enter-to-search — desktop trigger only; press Enter to fire (mirrors HeroSearch/LocationCombobox); the mobile sheet's search field is untouched"}),o.jsx(k,{options:t,variant:"input",placeholder:e("combobox_placeholder"),noResultsLabel:e("combobox_no_results"),sheetTitle:e("combobox_sheet_title"),firedLabel:e("combobox_enter_search_fired")})]})]})})}};d.parameters={...d.parameters,docs:{...(m=d.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    const options: MantineComboboxOption[] = [{
      value: 'tirana',
      label: t('combobox_option_tirana')
    }, {
      value: 'durres',
      label: t('combobox_option_durres')
    }, {
      value: 'vlore',
      label: t('combobox_option_vlore')
    }, {
      value: 'shkoder',
      label: t('combobox_option_shkoder')
    }, {
      value: 'saranda',
      label: t('combobox_option_saranda'),
      description: t('combobox_option_saranda_desc')
    }, {
      value: 'long',
      label: t('combobox_option_long')
    }];
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          {/* 1 — variant="input" resting: §6d/§6e chrome (gray-3 border / shadow-xs / brand focus /\r
              gray-4 placeholder / 44px). Click/tap the field to open — ≥640 anchored dropdown,\r
              <640 full-width bottom sheet with its own search field. This is the gate's scripted\r
              open-trigger target (first input/button in DOM order). */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              variant=&quot;input&quot; resting — §6d/§6e chrome; type to filter (desktop) or tap to\r
              open the sheet (mobile, own search field); ≥640 anchored dropdown, &lt;640 full-width\r
              bottom sheet\r
            </Text>\r
            <ControlledInput options={options} variant="input" placeholder={t('combobox_placeholder')} clearLabel={t('combobox_clear_label')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} />\r
          </Stack>\r
\r
          {/* 2 — variant="button" + searchable: compact trigger, search field lives INSIDE the\r
              dropdown/sheet (not on the trigger). §6x: search field reuses §6e input chrome\r
              verbatim (Task 537 STOP-and-ASK #4, option A). */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              variant=&quot;button&quot; + searchable — compact trigger; search field renders INSIDE\r
              the dropdown/sheet, not on the trigger; trigger label stays put while filtering\r
            </Text>\r
            <ControlledInput options={options} variant="button" searchable placeholder={t('combobox_placeholder')} searchPlaceholder={t('combobox_search_placeholder')} triggerAriaLabel={t('combobox_trigger_aria')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} />\r
          </Stack>\r
\r
          {/* 3 — variant="button" without searchable: compact trigger, static list, no search field */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              variant=&quot;button&quot; (no search) — compact trigger; static list, no search field\r
              anywhere\r
            </Text>\r
            <ControlledInput options={options} variant="button" placeholder={t('combobox_placeholder')} triggerAriaLabel={t('combobox_trigger_aria')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} />\r
          </Stack>\r
\r
          {/* 4 — error: red-6 border, no shadow, ring cleared; label stays gray (§6e) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — red-6 border / no shadow; message renders below in red; label color does NOT\r
              turn red (§6e)\r
            </Text>\r
            <ControlledInput options={options} variant="input" placeholder={t('combobox_placeholder')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} error={t('combobox_error')} />\r
          </Stack>\r
\r
          {/* 5 — disabled: whole control faded (§6e); tap/type does NOT open the dropdown/sheet */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — whole control faded (label + field + chevron → opacity 0.5); tap/type does\r
              NOT open the dropdown/sheet at any width\r
            </Text>\r
            <ControlledInput options={options} variant="input" placeholder={t('combobox_placeholder')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} disabled />\r
          </Stack>\r
\r
          {/* 6 — empty / no results: filter yields 0 → localized "no results" row, not a blank popup */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              empty options — immediate &quot;no results&quot; row, no crash; sheet/dropdown still\r
              opens and closes normally\r
            </Text>\r
            <ControlledInput options={[]} variant="input" placeholder={t('combobox_placeholder')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} />\r
          </Stack>\r
\r
          {/* 7 — long sq/uk/it label: wraps, never clips, no h-scroll at 320 (trigger + option row) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long label (§7) — long sq/uk/it option text wraps in the dropdown/sheet row; no clip,\r
              no h-scroll at 320\r
            </Text>\r
            <ControlledInput options={options} variant="input" placeholder={t('combobox_placeholder')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} />\r
          </Stack>\r
\r
          {/* 8 — triggerWidth override (Task 551): trigger fills its wrapper on desktop too, not\r
              just content-width \`sm:auto\` (the default). Mobile stays full-width either way. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              triggerWidth override — \`{'{ base: \\'100%\\', sm: \\'100%\\' }'}\` keeps the trigger at\r
              the wrapper&apos;s full width on desktop too (default, when the prop is omitted, is\r
              content-width \`sm:auto\` — see block 3 above)\r
            </Text>\r
            <ControlledInput options={options} variant="button" placeholder={t('combobox_placeholder')} triggerAriaLabel={t('combobox_trigger_aria')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} triggerWidth={{
            base: '100%',
            sm: '100%'
          }} />\r
          </Stack>\r
\r
          {/* 9 — numeric typeahead (Task 552): onInputChange + inputMode="numeric" — typing a full\r
              valid year live-commits it (YearCombobox's contract), on BOTH the desktop trigger and\r
              the mobile sheet's own search field. Absent onInputChange, behavior is byte-identical\r
              to block 1 (see the primitive smoke test for that proof). */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              numeric typeahead — \`onInputChange\` + \`inputMode=&quot;numeric&quot;\`; typing a full\r
              valid year live-commits it without opening the dropdown/sheet (mobile keypad is\r
              numeric); selecting from the list still works\r
            </Text>\r
            <NumericTypeaheadDemo options={Array.from({
            length: 9
          }, (_, i) => {
            const y = 2018 + i;
            return {
              value: String(y),
              label: String(y)
            };
          })} placeholder={t('combobox_numeric_placeholder')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} />\r
          </Stack>\r
\r
          {/* 10 — onKeyDown Enter-to-search (Task 553): reaches the DESKTOP trigger only — press\r
              Enter in the field below to see the "fired" indicator; the mobile sheet's own search\r
              field does not get this handler (Enter there filters/commits, never navigates). */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              onKeyDown Enter-to-search — desktop trigger only; press Enter to fire (mirrors\r
              HeroSearch/LocationCombobox); the mobile sheet&apos;s search field is untouched\r
            </Text>\r
            <EnterKeyDemo options={options} variant="input" placeholder={t('combobox_placeholder')} noResultsLabel={t('combobox_no_results')} sheetTitle={t('combobox_sheet_title')} firedLabel={t('combobox_enter_search_fired')} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(x=d.parameters)===null||x===void 0||(u=x.docs)===null||u===void 0?void 0:u.source}}};const ge=["Default"];export{d as Default,ge as __namedExportsOrder,_e as default};
