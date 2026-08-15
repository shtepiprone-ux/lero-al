import{j as a}from"./iframe-BWqC60Cj.js";import{s as C}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";var m,u,x,p,v,b,g,_,w,N,f,y;const B={title:"System/Containers",tags:["autodocs"],parameters:{docs:{description:{component:"Canonical container patterns. See docs/ui-rules.md §6 and docs/tailwind-canonical-fragments.md §1."}}}};function s({label:n,locale:l="en",className:e}){return a.jsxs("div",{className:`bg-primary/10 border border-primary/20 rounded-lg p-4 ${e??""}`,children:[a.jsx("p",{className:"text-xs font-mono text-primary",children:n}),a.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:C(l,"storybook.containers.content")})]})}const t={render:(n,l)=>{var e,r;const o=(r=l==null||(e=l.globals)===null||e===void 0?void 0:e.locale)!==null&&r!==void 0?r:"en";return a.jsx("div",{"data-testid":"container",className:"w-full bg-muted/30 py-8",children:a.jsx("div",{className:"container-wide mx-auto px-4",children:a.jsx(s,{label:".container-wide — max 88rem (1408px) — public pages",locale:o})})})},parameters:{layout:"fullscreen",docs:{description:{story:"At 2560px: `.container-wide` bounds content at 1408px, preventing whitespace wasteland."}}},globals:{viewport:{value:"desktop2560",isRotated:!1}}},i={render:(n,l)=>{var e,r;const o=(r=l==null||(e=l.globals)===null||e===void 0?void 0:e.locale)!==null&&r!==void 0?r:"en";return a.jsx("div",{className:"w-full bg-muted/30 py-8",children:a.jsx("div",{className:"max-w-5xl mx-auto px-4",children:a.jsx(s,{label:"max-w-5xl mx-auto — auth/cabinet pages (~64rem)",locale:o})})})},parameters:{layout:"fullscreen"}},d={render:(n,l)=>{var e,r;const o=(r=l==null||(e=l.globals)===null||e===void 0?void 0:e.locale)!==null&&r!==void 0?r:"en";return a.jsx("div",{className:"w-full bg-muted/30 py-8",children:a.jsx("div",{className:"max-w-6xl mx-auto p-6 lg:p-8",children:a.jsx(s,{label:"max-w-6xl mx-auto p-6 lg:p-8 — admin content",locale:o})})})},parameters:{layout:"fullscreen"}},c={render:(n,l)=>{var e,r;const o=(r=l==null||(e=l.globals)===null||e===void 0?void 0:e.locale)!==null&&r!==void 0?r:"en";return a.jsxs("div",{className:"space-y-4 w-full",children:[a.jsx("div",{className:"container-wide mx-auto px-4",children:a.jsx(s,{label:".container-wide (88rem) — public pages",locale:o,className:"border-blue-500/50 bg-blue-500/10"})}),a.jsx("div",{className:"max-w-5xl mx-auto px-4",children:a.jsx(s,{label:"max-w-5xl — auth/cabinet",locale:o,className:"border-green-500/50 bg-green-500/10"})}),a.jsx("div",{className:"max-w-3xl mx-auto px-4",children:a.jsx(s,{label:"max-w-3xl — narrow centered content",locale:o,className:"border-orange-500/50 bg-orange-500/10"})})]})},parameters:{layout:"fullscreen"}};t.parameters={...t.parameters,docs:{...(m=t.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div data-testid="container" className="w-full bg-muted/30 py-8">\r
      <div className="container-wide mx-auto px-4">\r
        <DemoBox label=".container-wide — max 88rem (1408px) — public pages" locale={locale} />\r
      </div>\r
    </div>;
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'At 2560px: \`.container-wide\` bounds content at 1408px, preventing whitespace wasteland.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'desktop2560',
      isRotated: false
    }
  }
}`,...(x=t.parameters)===null||x===void 0||(u=x.docs)===null||u===void 0?void 0:u.source}}};i.parameters={...i.parameters,docs:{...(p=i.parameters)===null||p===void 0?void 0:p.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="w-full bg-muted/30 py-8">\r
      <div className="max-w-5xl mx-auto px-4">\r
        <DemoBox label="max-w-5xl mx-auto — auth/cabinet pages (~64rem)" locale={locale} />\r
      </div>\r
    </div>;
  },
  parameters: {
    layout: 'fullscreen'
  }
}`,...(b=i.parameters)===null||b===void 0||(v=b.docs)===null||v===void 0?void 0:v.source}}};d.parameters={...d.parameters,docs:{...(g=d.parameters)===null||g===void 0?void 0:g.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="w-full bg-muted/30 py-8">\r
      <div className="max-w-6xl mx-auto p-6 lg:p-8">\r
        <DemoBox label="max-w-6xl mx-auto p-6 lg:p-8 — admin content" locale={locale} />\r
      </div>\r
    </div>;
  },
  parameters: {
    layout: 'fullscreen'
  }
}`,...(w=d.parameters)===null||w===void 0||(_=w.docs)===null||_===void 0?void 0:_.source}}};c.parameters={...c.parameters,docs:{...(N=c.parameters)===null||N===void 0?void 0:N.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="space-y-4 w-full">\r
      <div className="container-wide mx-auto px-4">\r
        <DemoBox label=".container-wide (88rem) — public pages" locale={locale} className="border-blue-500/50 bg-blue-500/10" />\r
      </div>\r
      <div className="max-w-5xl mx-auto px-4">\r
        <DemoBox label="max-w-5xl — auth/cabinet" locale={locale} className="border-green-500/50 bg-green-500/10" />\r
      </div>\r
      <div className="max-w-3xl mx-auto px-4">\r
        <DemoBox label="max-w-3xl — narrow centered content" locale={locale} className="border-orange-500/50 bg-orange-500/10" />\r
      </div>\r
    </div>;
  },
  parameters: {
    layout: 'fullscreen'
  }
}`,...(y=c.parameters)===null||y===void 0||(f=y.docs)===null||f===void 0?void 0:f.source}}};const D=["ContainerWide","ContainerNarrow","AdminContainer","AllContainers"];export{d as AdminContainer,c as AllContainers,i as ContainerNarrow,t as ContainerWide,D as __namedExportsOrder,B as default};
