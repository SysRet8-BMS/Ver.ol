import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"

// 1. Define your list of navigation data
const navItems = [
  { 
    id: 1, 
    trigger: "Home", 
    contentLink: "/", 
    contentLabel: "Go Home" 
  },
  { 
    id: 2, 
    trigger: "About Us", 
    contentLink: "/about", 
    contentLabel: "Learn More" 
  },
  {
    id:3,
    trigger:"Contact Us",
    contentLink: "/contact",
    contentLabel: "Contact Us"
  }
  // Add more items as needed
];

// 2. Use .map() inside the component
function Navbar() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        
        {/* Iterate over the navItems array using .map() */}
        {navItems.map((item) => (
          
          // **Important:** Always provide a unique 'key' prop when using .map()
          <NavigationMenuItem key={item.id}> 
            
            {/* The trigger text */}
            <NavigationMenuTrigger>{item.trigger}</NavigationMenuTrigger> 
            
            <NavigationMenuContent>
              
              {/* The content link (often uses a specific React Router Link component) */}
              <NavigationMenuLink href={item.contentLink}>
                {item.contentLabel}
              </NavigationMenuLink>
              
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}

      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default Navbar;