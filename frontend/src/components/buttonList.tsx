import { Button } from "@/components/ui/button"
import {Link} from 'react-router'

export default function ButtonList(){
    return (
        <div>
            <Link to="/signup">
                <Button className='bg-[#34a832] text-white'>Sign up</Button>
            </Link>
            
            <Link to="/login">
                <Button>Login</Button>
            </Link>
        </div>
    );
}