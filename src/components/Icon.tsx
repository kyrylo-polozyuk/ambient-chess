import {
  GiChessBishop,
  GiChessKing,
  GiChessKnight,
  GiChessPawn,
  GiChessQueen,
  GiChessRook,
} from "react-icons/gi"
import {
  LuBot,
  LuCopy,
  LuGlobe,
  LuLink,
  LuList,
  LuLoaderCircle,
  LuLogIn,
  LuLogOut,
  LuPlay,
  LuPlus,
  LuPopcorn,
  LuRefreshCw,
  LuSettings,
  LuUser,
  LuUsers,
  LuX,
} from "react-icons/lu"

const ICON_SIZE = "1.25rem"

const CHESS_PIECE_SIZE = "1.5rem"

export const ChessPieceIcons = {
  p: GiChessPawn,
  n: GiChessKnight,
  b: GiChessBishop,
  r: GiChessRook,
  q: GiChessQueen,
  k: GiChessKing,
} as const

export const Icons = {
  ChessQueen: () => <GiChessQueen size={ICON_SIZE} className="icon" />,
  ChessPiece: (props: {
    piece: keyof typeof ChessPieceIcons
    color: "w" | "b"
    size?: string | number
    className?: string
  }) => {
    const IconComponent = ChessPieceIcons[props.piece]
    return (
      <IconComponent
        size={props.size ?? CHESS_PIECE_SIZE}
        className={`${props.color === "w" ? "white-piece" : "black-piece"} ${props.className ?? ""}`}
      />
    )
  },
  Play: () => <LuPlay size={ICON_SIZE} className="icon" />,
  Bot: (props?: { size?: string | number }) => (
    <LuBot size={props?.size ?? ICON_SIZE} className="icon" />
  ),
  User: (props?: { size?: string | number }) => (
    <LuUser size={props?.size ?? ICON_SIZE} className="icon" />
  ),
  LogOut: () => <LuLogOut size={ICON_SIZE} className="icon" />,
  Close: () => <LuX size={ICON_SIZE} className="icon" />,
  Copy: () => <LuCopy size={ICON_SIZE} className="icon" />,
  Refresh: () => <LuRefreshCw size={ICON_SIZE} className="icon" />,
  Settings: () => <LuSettings size={ICON_SIZE} className="icon" />,
  Link: () => <LuLink size={ICON_SIZE} className="icon" />,
  Users: () => <LuUsers size={ICON_SIZE} className="icon" />,
  Popcorn: () => <LuPopcorn size={ICON_SIZE} className="icon" />,
  Globe: () => <LuGlobe size={ICON_SIZE} className="icon" />,
  Add: () => <LuPlus size={ICON_SIZE} className="icon" />,
  LogIn: () => <LuLogIn size={ICON_SIZE} className="icon" />,
  Loader: (props: { className?: string }) => (
    <LuLoaderCircle
      size={ICON_SIZE}
      className={props.className ? `icon ${props.className}` : "icon"}
    />
  ),
  List: () => <LuList size={ICON_SIZE} className="icon" />,
} as const
