import{j as e,r as be}from"./iframe-BWqC60Cj.js";import"./preload-helper-Dp1pzeXC.js";var w,y,_,j,I,C,S,O,R,k,P,B,W,E,L,A,N,V,G,T,z,D,F,U,K,Y,$,X,q,H,J,M,Q,Z,ee,te,re,ae,oe,ie,de,le,ne,se,pe,ce,ve,ue;function t({children:r}){return e.jsx("div",{"data-testid":"planted-violations-root",children:r})}const we={title:"Planted/VisualViolations",component:t},he="Btn-467: very long label that definitely gets clipped beyond container",a={render:()=>e.jsx(t,{children:e.jsx("div",{style:{width:60,overflow:"hidden"},children:e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-clipped-btn",style:{whiteSpace:"nowrap",padding:"8px 12px",cursor:"pointer"},children:he})})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},o={render:()=>e.jsx(t,{children:e.jsxs("div",{style:{position:"relative",width:200,height:50},children:[e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-overlap-a",style:{position:"absolute",left:0,top:0,width:120,height:40,padding:8,cursor:"pointer"},children:"Btn-A #467"}),e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-overlap-b",style:{position:"absolute",left:50,top:0,width:120,height:40,padding:8,cursor:"pointer"},children:"Btn-B #467"})]})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},i={render:()=>e.jsxs(t,{children:[e.jsx("p",{children:"Visible content #467"}),e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-offscreen-btn",style:{position:"fixed",right:-100,top:100,width:80,padding:8,cursor:"pointer"},children:"Off-screen #467"})]}),globals:{viewport:{value:"mobile320",isRotated:!1}}},d={render:()=>e.jsx(t,{children:e.jsx("div",{"data-testid":"planted-container-clip",style:{width:100,overflow:"hidden"},children:e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-container-btn",style:{width:200,padding:8,cursor:"pointer"},children:"Wide-btn #467 inside narrow container"})})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},l={render:()=>e.jsx(t,{children:e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-good",style:{padding:8,cursor:"pointer"},children:"Btn-good #467"})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},n={render:()=>e.jsx(t,{children:e.jsxs("div",{style:{position:"relative",width:200,height:50},children:[e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-ambiguous-trigger",style:{padding:8,cursor:"pointer",width:120},children:"Trigger #467"}),e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-ambiguous-popup",style:{position:"absolute",left:60,top:0,width:120,height:40,padding:8,cursor:"pointer"},children:"Popup #467"})]})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},s={render:()=>e.jsxs(t,{children:[e.jsx("p",{style:{marginBottom:8},children:"Container-escape proof: icon button extends past clip box."}),e.jsx("div",{"data-testid":"planted-escape-clip",style:{width:80,height:40,overflow:"hidden",position:"relative"},children:e.jsx("div",{role:"button",tabIndex:0,"aria-label":"#467","data-testid":"planted-escape-btn",style:{position:"absolute",left:50,top:0,width:60,height:30,cursor:"pointer",background:"#ccc"}})})]}),globals:{viewport:{value:"mobile320",isRotated:!1}}};function me(){const r=be.useRef(!1);return be.useLayoutEffect(()=>{if(r.current)return;r.current=!0;const f=document.createElement("style");f.setAttribute("data-planted-unstyled","true"),f.textContent=["body { margin: revert !important; }",'[data-testid="planted-violations-root"],','[data-testid="planted-violations-root"] * {',"  all: revert !important;","}"].join(`
`),document.head.appendChild(f)},[]),e.jsxs(e.Fragment,{children:[e.jsx("p",{children:"Planted unstyled frame for style-integrity proof R4."}),e.jsx("div",{role:"button",tabIndex:0,"data-slot":"button","data-testid":"planted-unstyled-btn",children:"Unstyled #467"})]})}const p={render:()=>e.jsx(t,{children:e.jsx(me,{})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},ge="Lnk-467-ellipsis-apartament-2+1-tirane-shume-i-mire-per-familje-te-vogel",c={render:()=>e.jsx(t,{children:e.jsx("a",{href:"#","aria-label":ge,"data-testid":"planted-ellipsis-link",style:{display:"block",width:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:8},children:ge})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},v={render:()=>e.jsx(t,{children:e.jsxs("div",{role:"button",tabIndex:0,"data-testid":"planted-sronly-btn",style:{position:"relative",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},children:[e.jsx("span",{style:{fontSize:20},children:"✕"}),e.jsx("span",{style:{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",borderWidth:0},children:"Close dialog button with very long sr-only label that definitely exceeds the tiny 1px container width"})]})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},u={render:()=>e.jsx(t,{children:e.jsx("div",{"data-testid":"planted-narrow-range",children:e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-narrow-range-btn",style:{padding:8,cursor:"pointer"},children:"Narrow-range #467"})})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},b={render:()=>e.jsx(t,{children:e.jsxs("div",{"data-testid":"planted-large-range",children:[e.jsx("p",{children:"Large-range guard #467"}),e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-large-range-btn",style:{padding:8,cursor:"pointer"},children:"Large-range-btn #467"})]})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},g={render:()=>e.jsx(t,{children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",width:200},children:[e.jsx("div",{"data-testid":"planted-scroll-region",style:{height:60,overflowY:"auto"},children:[1,2,3,4].map(r=>e.jsx("div",{role:"button",tabIndex:0,"data-testid":`planted-scroll-row-${r}`,style:{height:40,padding:8,cursor:"pointer"},children:`Row ${r} #569`},r))}),e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-scroll-footer",style:{height:36,padding:8,cursor:"pointer",borderTop:"1px solid #ccc"},children:"Footer #569"})]})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},h={render:()=>e.jsx(t,{children:e.jsx("div",{"data-testid":"planted-scroll-visible-region",style:{height:100,overflowY:"auto",position:"relative"},children:e.jsxs("div",{style:{position:"relative",width:200,height:50},children:[e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-scroll-visible-a",style:{position:"absolute",left:0,top:0,width:120,height:40,padding:8,cursor:"pointer"},children:"Visible-A #569"}),e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-scroll-visible-b",style:{position:"absolute",left:50,top:0,width:120,height:40,padding:8,cursor:"pointer"},children:"Visible-B #569"})]})})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},m={render:()=>e.jsxs(t,{children:[e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-backdrop-covered-bg",style:{position:"fixed",left:20,top:20,width:120,height:40,padding:8,cursor:"pointer"},children:"Background trigger #663"}),e.jsx("div",{className:"mantine-Overlay-root","data-testid":"planted-backdrop-covered-overlay",style:{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.6)"}}),e.jsx("div",{className:"mantine-Drawer-body","data-testid":"planted-backdrop-covered-sheet",style:{position:"fixed",left:0,top:0,width:320,height:200,zIndex:501,background:"#fff"},children:e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-backdrop-covered-sheet-btn",style:{position:"absolute",left:60,top:20,width:120,height:40,padding:8,cursor:"pointer"},children:"Sheet control #663"})})]}),globals:{viewport:{value:"mobile320",isRotated:!1}}},x={render:()=>e.jsxs(t,{children:[e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-no-backdrop-bg",style:{position:"fixed",left:20,top:100,width:120,height:40,padding:8,cursor:"pointer"},children:"Background trigger #663 (no backdrop)"}),e.jsx("div",{className:"mantine-Drawer-body","data-testid":"planted-no-backdrop-sheet",style:{position:"fixed",left:0,top:80,width:320,height:200,zIndex:10,background:"#fff"},children:e.jsx("div",{role:"button",tabIndex:0,"data-testid":"planted-no-backdrop-sheet-btn",style:{position:"absolute",left:60,top:20,width:120,height:40,padding:8,cursor:"pointer"},children:"Sheet control #663 (no backdrop)"})})]}),globals:{viewport:{value:"mobile320",isRotated:!1}}};a.parameters={...a.parameters,docs:{...(w=a.parameters)===null||w===void 0?void 0:w.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div style={{
      width: 60,
      overflow: 'hidden'
    }}>\r
        <div role="button" tabIndex={0} data-testid="planted-clipped-btn" style={{
        whiteSpace: 'nowrap',
        padding: '8px 12px',
        cursor: 'pointer'
      }}>\r
          {CLIPPED_LABEL}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(_=a.parameters)===null||_===void 0||(y=_.docs)===null||y===void 0?void 0:y.source}}};o.parameters={...o.parameters,docs:{...(j=o.parameters)===null||j===void 0?void 0:j.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div style={{
      position: 'relative',
      width: 200,
      height: 50
    }}>\r
        <div role="button" tabIndex={0} data-testid="planted-overlap-a" style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 120,
        height: 40,
        padding: 8,
        cursor: 'pointer'
      }}>\r
          {'Btn-A #467'}\r
        </div>\r
        <div role="button" tabIndex={0} data-testid="planted-overlap-b" style={{
        position: 'absolute',
        left: 50,
        top: 0,
        width: 120,
        height: 40,
        padding: 8,
        cursor: 'pointer'
      }}>\r
          {'Btn-B #467'}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(C=o.parameters)===null||C===void 0||(I=C.docs)===null||I===void 0?void 0:I.source}}};i.parameters={...i.parameters,docs:{...(S=i.parameters)===null||S===void 0?void 0:S.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <p>{'Visible content #467'}</p>\r
      <div role="button" tabIndex={0} data-testid="planted-offscreen-btn" style={{
      position: 'fixed',
      right: -100,
      top: 100,
      width: 80,
      padding: 8,
      cursor: 'pointer'
    }}>\r
        {'Off-screen #467'}\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(R=i.parameters)===null||R===void 0||(O=R.docs)===null||O===void 0?void 0:O.source}}};d.parameters={...d.parameters,docs:{...(k=d.parameters)===null||k===void 0?void 0:k.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div data-testid="planted-container-clip" style={{
      width: 100,
      overflow: 'hidden'
    }}>\r
        <div role="button" tabIndex={0} data-testid="planted-container-btn" style={{
        width: 200,
        padding: 8,
        cursor: 'pointer'
      }}>\r
          {'Wide-btn #467 inside narrow container'}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(B=d.parameters)===null||B===void 0||(P=B.docs)===null||P===void 0?void 0:P.source}}};l.parameters={...l.parameters,docs:{...(W=l.parameters)===null||W===void 0?void 0:W.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div role="button" tabIndex={0} data-testid="planted-good" style={{
      padding: 8,
      cursor: 'pointer'
    }}>\r
        {'Btn-good #467'}\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(L=l.parameters)===null||L===void 0||(E=L.docs)===null||E===void 0?void 0:E.source}}};n.parameters={...n.parameters,docs:{...(A=n.parameters)===null||A===void 0?void 0:A.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div style={{
      position: 'relative',
      width: 200,
      height: 50
    }}>\r
        <div role="button" tabIndex={0} data-testid="planted-ambiguous-trigger" style={{
        padding: 8,
        cursor: 'pointer',
        width: 120
      }}>\r
          {'Trigger #467'}\r
        </div>\r
        <div role="button" tabIndex={0} data-testid="planted-ambiguous-popup" style={{
        position: 'absolute',
        left: 60,
        top: 0,
        width: 120,
        height: 40,
        padding: 8,
        cursor: 'pointer'
      }}>\r
          {'Popup #467'}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(V=n.parameters)===null||V===void 0||(N=V.docs)===null||N===void 0?void 0:N.source}}};s.parameters={...s.parameters,docs:{...(G=s.parameters)===null||G===void 0?void 0:G.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <p style={{
      marginBottom: 8
    }}>{'Container-escape proof: icon button extends past clip box.'}</p>\r
      <div data-testid="planted-escape-clip" style={{
      width: 80,
      height: 40,
      overflow: 'hidden',
      position: 'relative'
    }}>\r
        <div role="button" tabIndex={0} aria-label="#467" data-testid="planted-escape-btn" style={{
        position: 'absolute',
        left: 50,
        top: 0,
        width: 60,
        height: 30,
        cursor: 'pointer',
        background: '#ccc'
      }} />\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(z=s.parameters)===null||z===void 0||(T=z.docs)===null||T===void 0?void 0:T.source}}};p.parameters={...p.parameters,docs:{...(D=p.parameters)===null||D===void 0?void 0:D.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <UnstyledContent />\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(U=p.parameters)===null||U===void 0||(F=U.docs)===null||F===void 0?void 0:F.source}}};c.parameters={...c.parameters,docs:{...(K=c.parameters)===null||K===void 0?void 0:K.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <a href="#" aria-label={ELLIPSIS_TEXT} data-testid="planted-ellipsis-link" style={{
      display: 'block',
      width: 80,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      padding: 8
    }}>\r
        {ELLIPSIS_TEXT}\r
      </a>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...($=c.parameters)===null||$===void 0||(Y=$.docs)===null||Y===void 0?void 0:Y.source}}};v.parameters={...v.parameters,docs:{...(X=v.parameters)===null||X===void 0?void 0:X.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div role="button" tabIndex={0} data-testid="planted-sronly-btn" style={{
      position: 'relative',
      width: 32,
      height: 32,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>\r
        <span style={{
        fontSize: 20
      }}>{'✕'}</span>\r
        <span style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0
      }}>\r
          {'Close dialog button with very long sr-only label that definitely exceeds the tiny 1px container width'}\r
        </span>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(H=v.parameters)===null||H===void 0||(q=H.docs)===null||q===void 0?void 0:q.source}}};u.parameters={...u.parameters,docs:{...(J=u.parameters)===null||J===void 0?void 0:J.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div data-testid="planted-narrow-range">\r
        <div role="button" tabIndex={0} data-testid="planted-narrow-range-btn" style={{
        padding: 8,
        cursor: 'pointer'
      }}>\r
          {'Narrow-range #467'}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(Q=u.parameters)===null||Q===void 0||(M=Q.docs)===null||M===void 0?void 0:M.source}}};b.parameters={...b.parameters,docs:{...(Z=b.parameters)===null||Z===void 0?void 0:Z.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div data-testid="planted-large-range">\r
        <p>{'Large-range guard #467'}</p>\r
        <div role="button" tabIndex={0} data-testid="planted-large-range-btn" style={{
        padding: 8,
        cursor: 'pointer'
      }}>\r
          {'Large-range-btn #467'}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(te=b.parameters)===null||te===void 0||(ee=te.docs)===null||ee===void 0?void 0:ee.source}}};g.parameters={...g.parameters,docs:{...(re=g.parameters)===null||re===void 0?void 0:re.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: 200
    }}>\r
        <div data-testid="planted-scroll-region" style={{
        height: 60,
        overflowY: 'auto'
      }}>\r
          {[1, 2, 3, 4].map(n => <div key={n} role="button" tabIndex={0} data-testid={\`planted-scroll-row-\${n}\`} style={{
          height: 40,
          padding: 8,
          cursor: 'pointer'
        }}>\r
              {\`Row \${n} #569\`}\r
            </div>)}\r
        </div>\r
        <div role="button" tabIndex={0} data-testid="planted-scroll-footer" style={{
        height: 36,
        padding: 8,
        cursor: 'pointer',
        borderTop: '1px solid #ccc'
      }}>\r
          {'Footer #569'}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(oe=g.parameters)===null||oe===void 0||(ae=oe.docs)===null||ae===void 0?void 0:ae.source}}};h.parameters={...h.parameters,docs:{...(ie=h.parameters)===null||ie===void 0?void 0:ie.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div data-testid="planted-scroll-visible-region" style={{
      height: 100,
      overflowY: 'auto',
      position: 'relative'
    }}>\r
        <div style={{
        position: 'relative',
        width: 200,
        height: 50
      }}>\r
          <div role="button" tabIndex={0} data-testid="planted-scroll-visible-a" style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 120,
          height: 40,
          padding: 8,
          cursor: 'pointer'
        }}>\r
            {'Visible-A #569'}\r
          </div>\r
          <div role="button" tabIndex={0} data-testid="planted-scroll-visible-b" style={{
          position: 'absolute',
          left: 50,
          top: 0,
          width: 120,
          height: 40,
          padding: 8,
          cursor: 'pointer'
        }}>\r
            {'Visible-B #569'}\r
          </div>\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(le=h.parameters)===null||le===void 0||(de=le.docs)===null||de===void 0?void 0:de.source}}};m.parameters={...m.parameters,docs:{...(ne=m.parameters)===null||ne===void 0?void 0:ne.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div role="button" tabIndex={0} data-testid="planted-backdrop-covered-bg" style={{
      position: 'fixed',
      left: 20,
      top: 20,
      width: 120,
      height: 40,
      padding: 8,
      cursor: 'pointer'
    }}>\r
        {'Background trigger #663'}\r
      </div>\r
      <div className="mantine-Overlay-root" data-testid="planted-backdrop-covered-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      background: 'rgba(0,0,0,0.6)'
    }} />\r
      <div className="mantine-Drawer-body" data-testid="planted-backdrop-covered-sheet" style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: 320,
      height: 200,
      zIndex: 501,
      background: '#fff'
    }}>\r
        <div role="button" tabIndex={0} data-testid="planted-backdrop-covered-sheet-btn" style={{
        position: 'absolute',
        left: 60,
        top: 20,
        width: 120,
        height: 40,
        padding: 8,
        cursor: 'pointer'
      }}>\r
          {'Sheet control #663'}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(pe=m.parameters)===null||pe===void 0||(se=pe.docs)===null||se===void 0?void 0:se.source}}};x.parameters={...x.parameters,docs:{...(ce=x.parameters)===null||ce===void 0?void 0:ce.docs,source:{originalSource:`{
  render: () => <PlantedWrapper>\r
      <div role="button" tabIndex={0} data-testid="planted-no-backdrop-bg" style={{
      position: 'fixed',
      left: 20,
      top: 100,
      width: 120,
      height: 40,
      padding: 8,
      cursor: 'pointer'
    }}>\r
        {'Background trigger #663 (no backdrop)'}\r
      </div>\r
      <div className="mantine-Drawer-body" data-testid="planted-no-backdrop-sheet" style={{
      position: 'fixed',
      left: 0,
      top: 80,
      width: 320,
      height: 200,
      zIndex: 10,
      background: '#fff'
    }}>\r
        <div role="button" tabIndex={0} data-testid="planted-no-backdrop-sheet-btn" style={{
        position: 'absolute',
        left: 60,
        top: 20,
        width: 120,
        height: 40,
        padding: 8,
        cursor: 'pointer'
      }}>\r
          {'Sheet control #663 (no backdrop)'}\r
        </div>\r
      </div>\r
    </PlantedWrapper>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(ue=x.parameters)===null||ue===void 0||(ve=ue.docs)===null||ve===void 0?void 0:ve.source}}};const ye=["ClippedButtonText","OverlappingActions","OffViewportControl","ContainerClipped","KnownGoodControl","AmbiguousOverlap","ContainerEscape","UnstyledFrame","IntentionalEllipsis","SrOnlyIconButton","NarrowRangeGuard","LargeRangeGuard","ScrollClippedOverlap","ScrollVisibleOverlap","OverlayBackdropCovered","OverlayNoBackdrop"];export{n as AmbiguousOverlap,a as ClippedButtonText,d as ContainerClipped,s as ContainerEscape,c as IntentionalEllipsis,l as KnownGoodControl,b as LargeRangeGuard,u as NarrowRangeGuard,i as OffViewportControl,o as OverlappingActions,m as OverlayBackdropCovered,x as OverlayNoBackdrop,g as ScrollClippedOverlap,h as ScrollVisibleOverlap,v as SrOnlyIconButton,p as UnstyledFrame,ye as __namedExportsOrder,we as default};
