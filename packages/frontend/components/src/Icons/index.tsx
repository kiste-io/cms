import Arrowdown from './Arrowdown';
import Check from './Check';
import Identity from './Identity';
import Info from './Info';
import Mail from './Mail';
import Delete from './Delete';
import Link  from './Link';
import Italic  from './Italic';
import Bold  from './Bold';
import Underline  from './Underline';

export type SVGIcon = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> &
    React.RefAttributes<SVGSVGElement>
>;

export const Icon = {
  Arrowdown,
  Check,
  Identity,
  Info,
  Mail,
  Delete,
  Link,
  Italic,
  Bold,
  Underline,
};
