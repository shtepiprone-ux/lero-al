import{j as e,r as T}from"./iframe-BWqC60Cj.js";import{I as t}from"./input-ByZEYirH.js";import{P as V}from"./PhoneField-BC8iARsx.js";import{s as O}from"./_storyI18n-DUPbxmag.js";import{S as W}from"./search-D3-0jNs5.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";import"./useControlled-COCwHvrc.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./shadowDom-KUr5fxLu.js";import"./useRegisterFieldControl-DQI04whl.js";import"./useLabelableId-DofIhODs.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./Stack-DqzY2ynC.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";var h,_,x,b,g,f,y,N,P,j,k,w,I,S,D,F,L,q,E,R,C;const Ae={title:"Primitives/Input",component:t,tags:["autodocs"],parameters:{},argTypes:{disabled:{control:"boolean"},placeholder:{control:"text"},type:{control:"select",options:["text","email","password","number","search","tel"]}}},i=(a,o="en")=>O(o,`storybook.input.${a}`),n={render:(a,o)=>{var l,r;const s=(r=o==null||(l=o.globals)===null||l===void 0?void 0:l.locale)!==null&&r!==void 0?r:"en";return e.jsx(t,{placeholder:i("addr",s)})}},d={render:(a,o)=>{var l,r;const s=(r=o==null||(l=o.globals)===null||l===void 0?void 0:l.locale)!==null&&r!==void 0?r:"en";return e.jsxs("div",{className:"flex flex-col gap-2 w-72",children:[e.jsx("label",{className:"text-sm font-medium",children:i("price",s)}),e.jsx(t,{type:"number",placeholder:"e.g. 150000"})]})}},c={render:(a,o)=>{var l,r;const s=(r=o==null||(l=o.globals)===null||l===void 0?void 0:l.locale)!==null&&r!==void 0?r:"en";return e.jsx(t,{disabled:!0,placeholder:i("disabled_ph",s),value:i("locked",s)})}},p={render:(a,o)=>{var l,r;const s=(r=o==null||(l=o.globals)===null||l===void 0?void 0:l.locale)!==null&&r!==void 0?r:"en";return e.jsxs("div",{className:"relative w-72",children:[e.jsx(W,{className:"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0"}),e.jsx(t,{className:"pl-9",placeholder:i("search",s)})]})},parameters:{docs:{description:{story:"Search input composition: canonical Input + search icon. Use locale toolbar for sq/en/uk/it."}}}},m={render:()=>e.jsx("div",{className:"flex flex-col gap-3 w-80",children:["en","sq","uk","it"].map(a=>e.jsx(t,{placeholder:O(a,"storybook.input.search")},a))}),parameters:{docs:{description:{story:"Input placeholder in en/sq/uk/it — verify text is not clipped. (Documentation story showing all 4 locales simultaneously.)"}}}},u={render:()=>e.jsxs("div",{className:"flex flex-col gap-6 w-80",children:[e.jsxs("div",{className:"flex flex-col gap-1.5",children:[e.jsx("label",{className:"text-sm font-medium",children:"Phone (valid — digits only)"}),e.jsx(t,{type:"tel",value:"691 234 567",readOnly:!0})]}),e.jsxs("div",{className:"flex flex-col gap-1.5",children:[e.jsx("label",{className:"text-sm font-medium",children:"Phone (error state — letters blocked)"}),e.jsx(t,{type:"tel",value:"691 234 567","aria-invalid":!0,readOnly:!0}),e.jsx("p",{className:"text-xs text-destructive mt-0.5",children:"Enter digits only — no letters or symbols."})]})]}),parameters:{docs:{description:{story:"PhoneField numeric-only validation states. Error key is localized in all 4 locales. See PhoneField.tsx and lib/phone/index.ts. (Task 363)"}}},globals:{viewport:{value:"mobile375",isRotated:!1}}};function M({locale:a}){const[o,l]=T.useState({national:"",dialCode:"+355",iso2:"AL",e164:""});return e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsxs("div",{className:"flex flex-col gap-2",children:[e.jsx("label",{className:"text-sm font-medium",children:i("fullname",a)}),e.jsx(t,{placeholder:i("name_ph",a)})]}),e.jsx(V,{value:o.e164,onChange:l,label:i("phone",a)})]})}const v={render:(a,o)=>{var l,r;return e.jsx(M,{locale:(r=o==null||(l=o.globals)===null||l===void 0?void 0:l.locale)!==null&&r!==void 0?r:"en"})},parameters:{docs:{description:{story:"Mobile form: canonical PhoneField — dial-code Combobox + national Input. Dropdown shows country names in the active locale (sq/en/uk/it via toolbar). CLDR-sourced names — no hardcode."}}},globals:{viewport:{value:"mobile375",isRotated:!1}}};n.parameters={...n.parameters,docs:{...(h=n.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <Input placeholder={inp('addr', l)} />;
  }
}`,...(x=n.parameters)===null||x===void 0||(_=x.docs)===null||_===void 0?void 0:_.source}}};d.parameters={...d.parameters,docs:{...(b=d.parameters)===null||b===void 0?void 0:b.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex flex-col gap-2 w-72">\r
        <label className="text-sm font-medium">{inp('price', l)}</label>\r
        <Input type="number" placeholder="e.g. 150000" />\r
      </div>;
  }
}`,...(f=d.parameters)===null||f===void 0||(g=f.docs)===null||g===void 0?void 0:g.source}}};c.parameters={...c.parameters,docs:{...(y=c.parameters)===null||y===void 0?void 0:y.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <Input disabled placeholder={inp('disabled_ph', l)} value={inp('locked', l)} />;
  }
}`,...(P=c.parameters)===null||P===void 0||(N=P.docs)===null||N===void 0?void 0:N.source}}};p.parameters={...p.parameters,docs:{...(j=p.parameters)===null||j===void 0?void 0:j.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="relative w-72">\r
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />\r
        <Input className="pl-9" placeholder={inp('search', l)} />\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Search input composition: canonical Input + search icon. Use locale toolbar for sq/en/uk/it.'
      }
    }
  }
}`,...(w=p.parameters)===null||w===void 0||(k=w.docs)===null||k===void 0?void 0:k.source}}};m.parameters={...m.parameters,docs:{...(I=m.parameters)===null||I===void 0?void 0:I.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 w-80">\r
      {(['en', 'sq', 'uk', 'it'] as string[]).map(l => <Input key={l} placeholder={storyT(l, 'storybook.input.search')} />)}\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Input placeholder in en/sq/uk/it — verify text is not clipped. (Documentation story showing all 4 locales simultaneously.)'
      }
    }
  }
}`,...(D=m.parameters)===null||D===void 0||(S=D.docs)===null||S===void 0?void 0:S.source}}};u.parameters={...u.parameters,docs:{...(F=u.parameters)===null||F===void 0?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-6 w-80">\r
      <div className="flex flex-col gap-1.5">\r
        <label className="text-sm font-medium">{'Phone (valid — digits only)'}</label>\r
        <Input type="tel" value="691 234 567" readOnly />\r
      </div>\r
      <div className="flex flex-col gap-1.5">\r
        <label className="text-sm font-medium">{'Phone (error state — letters blocked)'}</label>\r
        <Input type="tel" value="691 234 567" aria-invalid readOnly />\r
        <p className="text-xs text-destructive mt-0.5">{'Enter digits only — no letters or symbols.'}</p>\r
      </div>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'PhoneField numeric-only validation states. Error key is localized in all 4 locales. See PhoneField.tsx and lib/phone/index.ts. (Task 363)'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}`,...(q=u.parameters)===null||q===void 0||(L=q.docs)===null||L===void 0?void 0:L.source}}};v.parameters={...v.parameters,docs:{...(E=v.parameters)===null||E===void 0?void 0:E.docs,source:{originalSource:`{
  render: (_, context) => <MobileFormDemo locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'Mobile form: canonical PhoneField — dial-code Combobox + national Input. Dropdown shows country names in the active locale (sq/en/uk/it via toolbar). CLDR-sourced names — no hardcode.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}`,...(C=v.parameters)===null||C===void 0||(R=C.docs)===null||R===void 0?void 0:R.source}}};const $e=["Default","WithLabel","Disabled","SearchInput","LocalePlaceholders","PhoneNumericValidation","PhoneForm"];export{n as Default,c as Disabled,m as LocalePlaceholders,v as PhoneForm,u as PhoneNumericValidation,p as SearchInput,d as WithLabel,$e as __namedExportsOrder,Ae as default};
