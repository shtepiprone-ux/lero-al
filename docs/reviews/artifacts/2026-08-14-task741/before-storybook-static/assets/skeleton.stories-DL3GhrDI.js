import{j as e}from"./iframe-BWqC60Cj.js";import{S as s}from"./skeleton-BBWIc5OI.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";var o,l,i,n,t,c,m,p,g;const N={title:"Primitives/Skeleton",tags:["autodocs"],parameters:{}},r={render:()=>e.jsxs("div",{className:"w-full rounded-xl border bg-card overflow-hidden",children:[e.jsx(s,{className:"h-44 w-full rounded-none"}),e.jsxs("div",{className:"p-3 space-y-2",children:[e.jsx(s,{className:"h-4 w-3/4"}),e.jsx(s,{className:"h-3 w-1/2"}),e.jsx(s,{className:"h-5 w-1/3"})]})]}),parameters:{docs:{description:{story:"Listing card loading state skeleton."}}}},a={render:()=>e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5",children:Array.from({length:8}).map((u,v)=>e.jsxs("div",{className:"rounded-xl border bg-card overflow-hidden",children:[e.jsx(s,{className:"h-44 w-full rounded-none"}),e.jsxs("div",{className:"p-3 space-y-2",children:[e.jsx(s,{className:"h-4 w-3/4"}),e.jsx(s,{className:"h-3 w-1/2"}),e.jsx(s,{className:"h-5 w-1/3"})]})]},v))}),parameters:{docs:{description:{story:"Listing grid skeleton — 8 cards. Note `2xl:grid-cols-4` for huge desktop."}}},globals:{viewport:{value:"desktop1280",isRotated:!1}}},d={render:()=>e.jsxs("div",{className:"bg-card rounded-2xl border shadow-sm p-5 space-y-3 w-full max-w-xs",children:[e.jsx(s,{className:"h-4 w-1/2"}),e.jsx(s,{className:"h-8 w-full"}),e.jsx(s,{className:"h-3 w-3/4"})]})};r.parameters={...r.parameters,docs:{...(o=r.parameters)===null||o===void 0?void 0:o.docs,source:{originalSource:`{
  render: () => <div className="w-full rounded-xl border bg-card overflow-hidden">\r
      <Skeleton className="h-44 w-full rounded-none" />\r
      <div className="p-3 space-y-2">\r
        <Skeleton className="h-4 w-3/4" />\r
        <Skeleton className="h-3 w-1/2" />\r
        <Skeleton className="h-5 w-1/3" />\r
      </div>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Listing card loading state skeleton.'
      }
    }
  }
}`,...(i=r.parameters)===null||i===void 0||(l=i.docs)===null||l===void 0?void 0:l.source}}};a.parameters={...a.parameters,docs:{...(n=a.parameters)===null||n===void 0?void 0:n.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">\r
      {Array.from({
      length: 8
    }).map((_, i) => <div key={i} className="rounded-xl border bg-card overflow-hidden">\r
          <Skeleton className="h-44 w-full rounded-none" />\r
          <div className="p-3 space-y-2">\r
            <Skeleton className="h-4 w-3/4" />\r
            <Skeleton className="h-3 w-1/2" />\r
            <Skeleton className="h-5 w-1/3" />\r
          </div>\r
        </div>)}\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Listing grid skeleton — 8 cards. Note \`2xl:grid-cols-4\` for huge desktop.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(c=a.parameters)===null||c===void 0||(t=c.docs)===null||t===void 0?void 0:t.source}}};d.parameters={...d.parameters,docs:{...(m=d.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: () => <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-3 w-full max-w-xs">\r
      <Skeleton className="h-4 w-1/2" />\r
      <Skeleton className="h-8 w-full" />\r
      <Skeleton className="h-3 w-3/4" />\r
    </div>
}`,...(g=d.parameters)===null||g===void 0||(p=g.docs)===null||p===void 0?void 0:p.source}}};const S=["ListingCardSkeleton","ListingGridSkeleton","AdminCardSkeleton"];export{d as AdminCardSkeleton,r as ListingCardSkeleton,a as ListingGridSkeleton,S as __namedExportsOrder,N as default};
