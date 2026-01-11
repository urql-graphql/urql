import{I as Q,J as U,p as H,e as I,K as J,b as Y,t as d,L as m,A as i,j as g,d as A,z as B,w as c,M as C,N as G,q as V,O as W,S as w,P as X,F as Z,R as E,T as M}from"./urql-solid-start-DXMNIqM_.js";function ee(s,u){let n,r=()=>!n||n.state==="unresolved"?void 0:n.latest;[n]=Q(()=>te(s,U(()=>I(r),()=>{})),p=>p);const $=()=>n();return Object.defineProperty($,"latest",{get(){return n.latest}}),$}class t{static all(){return new t}static allSettled(){return new t}static any(){return new t}static race(){return new t}static reject(){return new t}static resolve(){return new t}catch(){return new t}then(){return new t}finally(){return new t}}function te(s,u){if(!H.context)return s(u);const n=fetch,r=Promise;try{return window.fetch=()=>new t,Promise=t,s(u)}finally{window.fetch=n,Promise=r}}var ne=c("<p style=color:red>Error: <!$><!/>"),re=c("<p style=color:green>Added: <!$><!/>"),ae=c("<ul>"),le=c('<main style=padding:20px;font-family:system-ui><h1>Pokemon List (SolidStart + URQL)</h1><section style=margin-bottom:20px><h2>Add Pokemon</h2><form style=display:flex;gap:10px;align-items:center><input type=text placeholder="Pokemon name"style=padding:8px;font-size:14px><button type=submit style="padding:8px 16px;font-size:14px"></button></form><!$><!/><!$><!/></section><section><h2>Pokemon List</h2><!$><!/>'),ie=c("<p>Loading..."),oe=c("<li>");const se=C`
  query Pokemons {
    pokemons(limit: 10) {
      id
      name
    }
  }
`,de=C`
  mutation AddPokemon($name: String!) {
    addPokemon(name: $name) {
      id
      name
    }
  }
`;function ue(){const s=G(),u=W(se,"list-pokemons"),n=ee(()=>u(s)),[r,$]=J(de),[p,v]=Y(""),N=async f=>{f.preventDefault();const h=p();if(!h)return;const o=await $({name:h});o.data&&(v(""),console.log("Pokemon added:",o.data.addPokemon))};return(()=>{var f=d(le),h=f.firstChild,o=h.nextSibling,O=o.firstChild,x=O.nextSibling,_=x.firstChild,y=_.nextSibling,L=x.nextSibling,[P,R]=m(L.nextSibling),q=P.nextSibling,[F,T]=m(q.nextSibling),k=o.nextSibling,j=k.firstChild,z=j.nextSibling,[D,K]=m(z.nextSibling);return x.addEventListener("submit",N),_.$$input=e=>v(e.currentTarget.value),i(y,()=>r.fetching?"Adding...":"Add Pokemon"),i(o,g(w,{get when(){return r.error},get children(){var e=d(ne),l=e.firstChild,a=l.nextSibling,[S,b]=m(a.nextSibling);return i(e,()=>r.error?.message,S,b),e}}),P,R),i(o,g(w,{get when(){return r.data},get children(){var e=d(re),l=e.firstChild,a=l.nextSibling,[S,b]=m(a.nextSibling);return i(e,()=>r.data.addPokemon.name,S,b),e}}),F,T),i(k,g(Z,{get fallback(){return d(ie)},get children(){return g(w,{get when(){return n()?.data},get children(){var e=d(ae);return i(e,g(X,{get each(){return n().data.pokemons},children:l=>(()=>{var a=d(oe);return i(a,()=>l.name),a})()})),e}})}}),D,K),A(e=>{var l=r.fetching,a=r.fetching?"not-allowed":"pointer";return l!==e.e&&E(y,"disabled",e.e=l),a!==e.t&&M(y,"cursor",e.t=a),e},{e:void 0,t:void 0}),A(()=>E(_,"value",p())),B(),f})()}V(["input"]);export{ue as default};
