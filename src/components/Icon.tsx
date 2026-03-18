import { GiChessQueen } from "react-icons/gi"
import {
  LuArrowRight,
  LuCopy,
  LuList,
  LuLoaderCircle,
  LuLogIn,
  LuLogOut,
  LuPlay,
  LuPlus,
  LuRefreshCw,
  LuShare,
  LuUsers,
  LuX,
} from "react-icons/lu"

const ICON_SIZE = 20

export const Icons = {
  ChessQueen: () => <GiChessQueen size={ICON_SIZE} className="icon" />,
  Play: () => <LuPlay size={ICON_SIZE} className="icon" />,
  LogOut: () => <LuLogOut size={ICON_SIZE} className="icon" />,
  Close: () => <LuX size={ICON_SIZE} className="icon" />,
  Copy: () => <LuCopy size={ICON_SIZE} className="icon" />,
  Refresh: () => <LuRefreshCw size={ICON_SIZE} className="icon" />,
  Share: () => <LuShare size={ICON_SIZE} className="icon" />,
  Users: () => <LuUsers size={ICON_SIZE} className="icon" />,
  Add: () => <LuPlus size={ICON_SIZE} className="icon" />,
  ArrowForward: () => <LuArrowRight size={ICON_SIZE} className="icon" />,
  LogIn: () => <LuLogIn size={ICON_SIZE} className="icon" />,
  Loader: (props: { className?: string }) => (
    <LuLoaderCircle
      size={ICON_SIZE}
      className={props.className ? `icon ${props.className}` : "icon"}
    />
  ),
  List: () => <LuList size={ICON_SIZE} className="icon" />,
} as const
