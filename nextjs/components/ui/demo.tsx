"use client";

import { Header1 } from "@/components/ui/header";

function HeaderDemo() {
  return (
    <div className="block">
      <Header1
        cartCount={2}
        favCount={1}
        onCartClick={() => console.log("open cart drawer")}
        onFavClick={() => console.log("open favourites")}
        onSearch={(q) => console.log("search:", q)}
      />
    </div>
  );
}

export { HeaderDemo };
