import{j as l,r as c}from"./iframe-BWqC60Cj.js";import{B as t}from"./button-DqckHWPj.js";import{s as se}from"./_storyI18n-DUPbxmag.js";import{P as y}from"./plus-Cc25WxNA.js";import{T as ae}from"./trash-2-g77RJjTg.js";import{L as te}from"./loader-circle-DsIh30M6.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./createLucideIcon-DZTr3VOw.js";var z,k,C,S,L,D,R,A,I,N,T,B,O,E,U,M,V,W,F,P,q,K,X,Y,$,G,H,J,Q,Z,ee,le,oe;const ne={save_ch:"save_changes",delete_lst:"delete_listing",del_forever:"delete_forever",contact_lg:"contact_long",add_out:"add"},De={title:"Primitives/Button",component:t,tags:["autodocs"],parameters:{docs:{description:{component:"Canonical button. Always use this instead of raw `<button>`. All buttons in stories are interactive — clicking shows in-canvas feedback. See docs/ui-rules.md §3 for size/variant governance."}}},argTypes:{variant:{control:"select",options:["default","outline","secondary","ghost","destructive","link"]},size:{control:"select",options:["xs","sm","default","lg","xl","icon","icon-xl","icon-sm","icon-xs"]},disabled:{control:"boolean"}}},r=(a,s="en")=>{var e;return se(s,`storybook.button.${(e=ne[a])!==null&&e!==void 0?e:a}`)};function d({label:a,locale:s="en"}){return a?l.jsxs("p",{className:"text-xs text-muted-foreground mt-2 px-0.5",children:[r("clicked",s),": ",l.jsx("strong",{children:a})]}):null}const m={render:(a,s)=>{var e,o;const n=(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en";return l.jsx(t,{children:r("save",n)})}};function re({locale:a}){const[s,e]=c.useState(null),o=n=>se(a,`storybook.button.${n}`);return l.jsxs("div",{children:[l.jsxs("div",{className:"flex flex-wrap gap-3",children:[l.jsx(t,{variant:"default",onClick:()=>e(o("variant_primary")),children:o("variant_primary")}),l.jsx(t,{variant:"outline",onClick:()=>e(o("variant_outline")),children:o("variant_outline")}),l.jsx(t,{variant:"secondary",onClick:()=>e(o("variant_secondary")),children:o("variant_secondary")}),l.jsx(t,{variant:"ghost",onClick:()=>e(o("variant_ghost")),children:o("variant_ghost")}),l.jsx(t,{variant:"destructive",onClick:()=>e(o("variant_destructive")),children:o("variant_destructive")}),l.jsx(t,{variant:"link",onClick:()=>e(o("variant_link")),children:o("variant_link")})]}),l.jsx(d,{label:s,locale:a})]})}const v={render:(a,s)=>{var e,o;return l.jsx(re,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})}};function ie({locale:a}){const[s,e]=c.useState(null),n=["XS","SM",se(a,"storybook.button.size_default"),"LG","XL"];return l.jsxs("div",{children:[l.jsxs("div",{className:"flex flex-wrap items-end gap-3",children:[l.jsx(t,{size:"xs",onClick:()=>e(n[0]),children:n[0]}),l.jsx(t,{size:"sm",onClick:()=>e(n[1]),children:n[1]}),l.jsx(t,{size:"default",onClick:()=>e(n[2]),children:n[2]}),l.jsx(t,{size:"lg",onClick:()=>e(n[3]),children:n[3]}),l.jsx(t,{size:"xl",onClick:()=>e(n[4]),children:n[4]})]}),l.jsx(d,{label:s,locale:a})]})}const x={render:(a,s)=>{var e,o;return l.jsx(ie,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})},parameters:{docs:{description:{story:"All text sizes (`xs`, `sm`, `default`, `lg`, `xl`) are full-width at <640px and ≥44px tall. Icon-only sizes (`icon`, `icon-xl`, `icon-sm`, `icon-xs`, `icon-lg`) stay compact at all widths."}}}};function ce({locale:a}){const[s,e]=c.useState(null),o=r("contact",a);return l.jsxs("div",{children:[l.jsx(t,{size:"xl",onClick:()=>e(o),children:o}),l.jsx(d,{label:s,locale:a})]})}const p={render:(a,s)=>{var e,o;return l.jsx(ce,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})},parameters:{docs:{description:{story:'All text sizes are mobile-safe: `max-sm:w-full` (full-width at <640px), `max-sm:min-h-11` (≥44px touch target). `size="xl"` shown here — same contract applies to sm/default/lg.'}}},globals:{viewport:{value:"mobile375",isRotated:!1}}};function de({locale:a}){const[s,e]=c.useState(null),o=r("add",a),n=r("delete",a),i=r("saving",a);return l.jsxs("div",{children:[l.jsxs("div",{className:"flex flex-wrap gap-3",children:[l.jsxs(t,{onClick:()=>e(o),children:[l.jsx(y,{})," ",o]}),l.jsxs(t,{variant:"outline",onClick:()=>e(o),children:[l.jsx(y,{})," ",o]}),l.jsxs(t,{variant:"destructive",onClick:()=>e(n),children:[l.jsx(ae,{})," ",n]}),l.jsxs(t,{disabled:!0,children:[l.jsx(te,{className:"animate-spin"})," ",i]})]}),l.jsx(d,{label:s,locale:a})]})}const _={render:(a,s)=>{var e,o;return l.jsx(de,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})}};function ue({locale:a}){const[s,e]=c.useState(null),o=r("add",a),n=r("delete",a);return l.jsxs("div",{children:[l.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[l.jsx(t,{size:"icon",variant:"outline","aria-label":o,onClick:()=>e(o),children:l.jsx(y,{})}),l.jsx(t,{size:"icon-xl",variant:"outline","aria-label":o,onClick:()=>e(o),children:l.jsx(y,{})}),l.jsx(t,{size:"icon-sm",variant:"ghost","aria-label":n,onClick:()=>e(n),children:l.jsx(ae,{})})]}),l.jsx(d,{label:s,locale:a})]})}const h={render:(a,s)=>{var e,o;return l.jsx(ue,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})},parameters:{docs:{description:{story:'Icon-only buttons MUST have `aria-label`. Use `size="icon-xl"` (44px) for mobile.'}}}},g={render:(a,s)=>{var e,o;const n=(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en";return l.jsx(t,{disabled:!0,children:r("submit",n)})}};function me({locale:a}){const[s,e]=c.useState(null),o=r("delete",a),n=r("export",a),i=r("cancel",a),u=r("save_ch",a);return l.jsxs("div",{children:[l.jsxs("div",{className:"flex flex-wrap gap-2 items-center",children:[l.jsx(t,{size:"xl",variant:"destructive",onClick:()=>e(o),children:o}),l.jsx(t,{size:"xl",variant:"ghost",onClick:()=>e(n),children:n}),l.jsx(t,{size:"xl",variant:"outline",onClick:()=>e(i),children:i}),l.jsx(t,{size:"xl",onClick:()=>e(u),children:u})]}),l.jsx(d,{label:s,locale:a})]})}const b={render:(a,s)=>{var e,o;return l.jsx(me,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})},parameters:{docs:{description:{story:'One-row-one-height proof: primary, secondary (outline), ghost/tertiary, and destructive, all at size="xl" (h-11 = 44px). In the same DS control row, no action button may be visually taller or shorter than its siblings.'}}},globals:{viewport:{value:"desktop1440",isRotated:!1}}};function ve({locale:a}){const[s,e]=c.useState(null),o=r("delete_lst",a),n=r("export",a),i=r("cancel",a),u=r("save_ch",a);return l.jsxs("div",{children:[l.jsxs("div",{className:"flex flex-col gap-2 w-full px-3",children:[l.jsx(t,{size:"xl",variant:"destructive",onClick:()=>e(o),children:o}),l.jsx(t,{size:"xl",variant:"ghost",onClick:()=>e(n),children:n}),l.jsx(t,{size:"xl",variant:"outline",onClick:()=>e(i),children:i}),l.jsx(t,{size:"xl",onClick:()=>e(u),children:u})]}),l.jsx(d,{label:s,locale:a})]})}const f={render:(a,s)=>{var e,o;return l.jsx(ve,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})},parameters:{docs:{description:{story:'320px: all four action types at size="xl" (44px). Full-width is automatic via `max-sm:w-full` in the primitive — no manual `className="w-full"` needed.'}}},globals:{viewport:{value:"mobile320",isRotated:!1}}};function xe({locale:a}){const[s,e]=c.useState(null),o=r("contact_lg",a),n=r("browse_rent",a),i=r("save_search",a);return l.jsxs("div",{className:"flex flex-col gap-3 max-w-xs",children:[l.jsx("p",{className:"text-xs text-muted-foreground font-medium",children:"size=xl"}),l.jsx(t,{size:"xl",onClick:()=>e("xl"),children:o}),l.jsx("p",{className:"text-xs text-muted-foreground font-medium",children:"size=lg"}),l.jsx(t,{size:"lg",variant:"outline",onClick:()=>e("lg"),children:n}),l.jsx("p",{className:"text-xs text-muted-foreground font-medium",children:"size=default"}),l.jsx(t,{size:"default",onClick:()=>e("default"),children:o}),l.jsx("p",{className:"text-xs text-muted-foreground font-medium",children:"size=sm"}),l.jsx(t,{size:"sm",variant:"secondary",onClick:()=>e("sm"),children:i}),l.jsx(d,{label:s,locale:a})]})}const j={render:(a,s)=>{var e,o;return l.jsx(xe,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})},parameters:{docs:{description:{story:"Long locale labels at 375px — all text sizes must wrap gracefully, never clip. Full-width is automatic at <640px for `xl`, `lg`, `default`, `sm`. Use locale toolbar to switch language."}}},globals:{viewport:{value:"mobile375",isRotated:!1}}};function pe({locale:a}){const[s,e]=c.useState(null),o=r("contact_lg",a),n=r("browse_rent",a),i=r("save_search",a),u=r("del_forever",a);return l.jsxs("div",{className:"w-full px-4 flex flex-col gap-3",children:[l.jsx("p",{className:"text-xs text-muted-foreground font-medium",children:"size=xl"}),l.jsx(t,{size:"xl",onClick:()=>e("xl-primary"),children:o}),l.jsx(t,{size:"xl",variant:"outline",onClick:()=>e("xl-outline"),children:n}),l.jsx("p",{className:"text-xs text-muted-foreground font-medium mt-1",children:"size=lg"}),l.jsx(t,{size:"lg",onClick:()=>e("lg-primary"),children:o}),l.jsx(t,{size:"lg",variant:"outline",onClick:()=>e("lg-outline"),children:n}),l.jsx("p",{className:"text-xs text-muted-foreground font-medium mt-1",children:"size=default"}),l.jsx(t,{size:"default",onClick:()=>e("default-primary"),children:o}),l.jsx(t,{size:"default",variant:"secondary",onClick:()=>e("default-secondary"),children:i}),l.jsx("p",{className:"text-xs text-muted-foreground font-medium mt-1",children:"size=sm"}),l.jsx(t,{size:"sm",onClick:()=>e("sm-primary"),children:o}),l.jsx(t,{size:"sm",variant:"destructive",onClick:()=>e("sm-destructive"),children:u}),l.jsx(d,{label:s,locale:a})]})}const w={render:(a,s)=>{var e,o;return l.jsx(pe,{locale:(o=s==null||(e=s.globals)===null||e===void 0?void 0:e.locale)!==null&&o!==void 0?o:"en"})},parameters:{docs:{description:{story:"@320: ALL text sizes (`xl`, `lg`, `default`, `sm`) are full-width (`max-sm:w-full`) and long labels wrap without overflow. Each size is ≥44px tall (`max-sm:min-h-11`). Use locale toolbar — labels switch between sq/en/uk/it. At ≥640px buttons revert to content-width."}}},globals:{viewport:{value:"mobile320",isRotated:!1}}};m.parameters={...m.parameters,docs:{...(z=m.parameters)===null||z===void 0?void 0:z.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <Button>{L('save', locale)}</Button>;
  }
}`,...(C=m.parameters)===null||C===void 0||(k=C.docs)===null||k===void 0?void 0:k.source}}};v.parameters={...v.parameters,docs:{...(S=v.parameters)===null||S===void 0?void 0:S.docs,source:{originalSource:`{
  render: (_, context) => <AllVariantsDemo locale={context?.globals?.locale as string ?? 'en'} />
}`,...(D=v.parameters)===null||D===void 0||(L=D.docs)===null||L===void 0?void 0:L.source}}};x.parameters={...x.parameters,docs:{...(R=x.parameters)===null||R===void 0?void 0:R.docs,source:{originalSource:"{\n  render: (_, context) => <AllSizesDemo locale={context?.globals?.locale as string ?? 'en'} />,\n  parameters: {\n    docs: {\n      description: {\n        story: 'All text sizes (`xs`, `sm`, `default`, `lg`, `xl`) are full-width at <640px and ≥44px tall. ' + 'Icon-only sizes (`icon`, `icon-xl`, `icon-sm`, `icon-xs`, `icon-lg`) stay compact at all widths.'\n      }\n    }\n  }\n}",...(I=x.parameters)===null||I===void 0||(A=I.docs)===null||A===void 0?void 0:A.source}}};p.parameters={...p.parameters,docs:{...(N=p.parameters)===null||N===void 0?void 0:N.docs,source:{originalSource:`{
  render: (_, context) => <MobileSafeDemo locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'All text sizes are mobile-safe: \`max-sm:w-full\` (full-width at <640px), ' + '\`max-sm:min-h-11\` (≥44px touch target). \`size="xl"\` shown here — same contract applies to sm/default/lg.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}`,...(B=p.parameters)===null||B===void 0||(T=B.docs)===null||T===void 0?void 0:T.source}}};_.parameters={..._.parameters,docs:{...(O=_.parameters)===null||O===void 0?void 0:O.docs,source:{originalSource:`{
  render: (_, context) => <WithIconDemo locale={context?.globals?.locale as string ?? 'en'} />
}`,...(U=_.parameters)===null||U===void 0||(E=U.docs)===null||E===void 0?void 0:E.source}}};h.parameters={...h.parameters,docs:{...(M=h.parameters)===null||M===void 0?void 0:M.docs,source:{originalSource:`{
  render: (_, context) => <IconOnlyDemo locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons MUST have \`aria-label\`. Use \`size="icon-xl"\` (44px) for mobile.'
      }
    }
  }
}`,...(W=h.parameters)===null||W===void 0||(V=W.docs)===null||V===void 0?void 0:V.source}}};g.parameters={...g.parameters,docs:{...(F=g.parameters)===null||F===void 0?void 0:F.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <Button disabled>{L('submit', locale)}</Button>;
  }
}`,...(q=g.parameters)===null||q===void 0||(P=q.docs)===null||P===void 0?void 0:P.source}}};b.parameters={...b.parameters,docs:{...(K=b.parameters)===null||K===void 0?void 0:K.docs,source:{originalSource:`{
  render: (_, context) => <ControlRowDesktopDemo locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'One-row-one-height proof: primary, secondary (outline), ghost/tertiary, and destructive, all at size="xl" (h-11 = 44px). ' + 'In the same DS control row, no action button may be visually taller or shorter than its siblings.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(Y=b.parameters)===null||Y===void 0||(X=Y.docs)===null||X===void 0?void 0:X.source}}};f.parameters={...f.parameters,docs:{...($=f.parameters)===null||$===void 0?void 0:$.docs,source:{originalSource:`{
  render: (_, context) => <ControlRowMobile320Demo locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: '320px: all four action types at size="xl" (44px). ' + 'Full-width is automatic via \`max-sm:w-full\` in the primitive — no manual \`className="w-full"\` needed.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(H=f.parameters)===null||H===void 0||(G=H.docs)===null||G===void 0?void 0:G.source}}};j.parameters={...j.parameters,docs:{...(J=j.parameters)===null||J===void 0?void 0:J.docs,source:{originalSource:`{
  render: (_, context) => <LongLocaleLabelDemo locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'Long locale labels at 375px — all text sizes must wrap gracefully, never clip. ' + 'Full-width is automatic at <640px for \`xl\`, \`lg\`, \`default\`, \`sm\`. Use locale toolbar to switch language.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}`,...(Z=j.parameters)===null||Z===void 0||(Q=Z.docs)===null||Q===void 0?void 0:Q.source}}};w.parameters={...w.parameters,docs:{...(ee=w.parameters)===null||ee===void 0?void 0:ee.docs,source:{originalSource:`{
  render: (_, context) => <LocaleStressDemo locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: '@320: ALL text sizes (\`xl\`, \`lg\`, \`default\`, \`sm\`) are full-width (\`max-sm:w-full\`) ' + 'and long labels wrap without overflow. Each size is ≥44px tall (\`max-sm:min-h-11\`). ' + 'Use locale toolbar — labels switch between sq/en/uk/it. At ≥640px buttons revert to content-width.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(oe=w.parameters)===null||oe===void 0||(le=oe.docs)===null||le===void 0?void 0:le.source}}};const Re=["Default","AllVariants","AllSizes","TouchSafe","WithIcon","IconOnly","Disabled","ControlRowRhythm_Inline","ControlRowRhythm_Stacked","LongLocaleLabel","LocaleStress"];export{x as AllSizes,v as AllVariants,b as ControlRowRhythm_Inline,f as ControlRowRhythm_Stacked,m as Default,g as Disabled,h as IconOnly,w as LocaleStress,j as LongLocaleLabel,p as TouchSafe,_ as WithIcon,Re as __namedExportsOrder,De as default};
