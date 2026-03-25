import type { SyncedDocument } from "@audiotool/nexus"
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { Chessboard as ReactChessboard } from "react-chessboard"
import { Icons } from "../../components/Icon"
import { AudiotoolContext } from "../../context"
import { useDialog } from "../../dialog/useDialog"
import {
  getStoredFen,
  updateTonematrixFromChessBoard,
} from "../../nexus/updateTonematrixFromChess"
import { useBpm } from "../../nexus/useBpm"
import { useFenSyncFromNexus } from "../../nexus/useFenSyncFromNexus"
import { useSettings } from "../../settings/useSettings"
import {
  chessLastMoveHighlight,
  chessLegalMoveHighlight,
  chessSelectedSquareHighlight,
} from "../../theme"
import type { ChessboardProps, ChessboardRef } from "../Chessboard"
import type { PieceSymbol } from "../chess"
import { Chess, type Square } from "../engine/chessAdapter"
import { getStockfishMove } from "../engine/chessApi"

const FEN_START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

const PROMOTION_PIECES: PieceSymbol[] = ["q", "r", "n", "b"]

const squareToBoardIndices = (sq: string): [number, number] => {
  const file = sq.charCodeAt(0) - 97
  const rank = parseInt(sq[1], 10)
  return [8 - rank, file]
}

const isPromotionMove = (game: Chess, from: string, to: string): boolean => {
  const [row, col] = squareToBoardIndices(from)
  const piece = game.board()[row]?.[col]
  if (!piece || piece.type !== "p") return false
  const toRank = to[1]
  return toRank === "1" || toRank === "8"
}

export const Chessboard = forwardRef<ChessboardRef, ChessboardProps>(
  (
    {
      tonematrix,
      autoPlay,
      computerPlaysAs,
      userPlaysAs,
      whitePlayerName,
      blackPlayerName,
      onStatusChange,
    },
    ref,
  ) => {
    const { nexus } = useContext(AudiotoolContext)
    const { piecesSoundAfterMoveOnly } = useSettings()
    const gameRef = useRef(new Chess())
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const autoPlayRef = useRef(autoPlay)
    const hasLoadedFromStoredRef = useRef(false)
    const lastSyncedDocumentRef = useRef<SyncedDocument | undefined>(undefined)

    const [position, setPosition] = useState(FEN_START)
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
    const [lastMove, setLastMove] = useState<{
      from: string
      to: string
    } | null>(null)
    const [ready, setReady] = useState(false)
    const [fenPatternsReady, setFenPatternsReady] = useState(false)

    const bpm = useBpm()
    const moveDelayMs = 60000 / bpm

    autoPlayRef.current = autoPlay

    const syncBoardToTonematrix = useCallback(() => {
      if (nexus) {
        const game = gameRef.current
        return updateTonematrixFromChessBoard(nexus, game.board(), game.fen(), {
          piecesSoundAfterMoveOnly,
        })
      }
      return Promise.resolve()
    }, [nexus, piecesSoundAfterMoveOnly])

    const whiteLabel = whitePlayerName ? `${whitePlayerName} (white)` : "White"
    const blackLabel = blackPlayerName ? `${blackPlayerName} (black)` : "Black"

    const updateStatus = useCallback(() => {
      const game = gameRef.current
      if (game.isCheckmate()) {
        onStatusChange({
          message:
            game.turn() === "w"
              ? `${blackLabel} wins by checkmate!`
              : `${whiteLabel} wins by checkmate!`,
          phase: "finished",
        })
      } else if (game.isDraw()) {
        onStatusChange({ message: "Game drawn!", phase: "finished" })
      } else if (game.isStalemate()) {
        onStatusChange({ message: "Stalemate!", phase: "finished" })
      } else {
        onStatusChange({
          message: `${game.turn() === "w" ? whiteLabel : blackLabel} to move`,
          phase: "ongoing",
        })
      }
    }, [whiteLabel, blackLabel, onStatusChange])

    const { showDialog, closeDialog } = useDialog()

    const applyMove = useCallback(
      (from: string, to: string, promotion?: PieceSymbol) => {
        const game = gameRef.current
        const result = game.move({ from, to, promotion })
        if (result) {
          setPosition(game.fen())
          setLastMove({ from, to })
          updateStatus()
          syncBoardToTonematrix()
          setSelectedSquare(null)
          return true
        }
        return false
      },
      [updateStatus, syncBoardToTonematrix],
    )

    const handleFenChangeFromNexus = useCallback(
      (fen: string | null) => {
        if (!fen) return
        if (gameRef.current.fen() === fen) return
        try {
          gameRef.current = new Chess(fen)
          setPosition(fen)
          setSelectedSquare(null)
          setLastMove(null)
          updateStatus()
        } catch (e) {
          console.error("Invalid FEN from Nexus:", e)
        }
      },
      [updateStatus],
    )

    useFenSyncFromNexus(handleFenChangeFromNexus, {
      patternsReady: fenPatternsReady,
    })

    const restart = useCallback(() => {
      gameRef.current = new Chess()
      setPosition(FEN_START)
      setSelectedSquare(null)
      setLastMove(null)
      updateStatus()
      syncBoardToTonematrix()
    }, [updateStatus, syncBoardToTonematrix])

    const makeAiMove = useCallback(
      async (delayMs: number) => {
        const game = gameRef.current
        if (game.isGameOver()) {
          updateStatus()
          return
        }

        let bestMove: import("../engine/chessAdapter").VerboseMove | null

        bestMove = await getStockfishMove(game.fen())
        if (!bestMove) {
          bestMove = game.getAiMove(4)
        }

        if (!bestMove) {
          updateStatus()
          return
        }

        game.move(bestMove)
        setPosition(game.fen())
        setLastMove({ from: bestMove.from, to: bestMove.to })
        updateStatus()
        syncBoardToTonematrix()

        if (autoPlayRef.current) {
          timerRef.current = setTimeout(() => void makeAiMove(delayMs), delayMs)
        }
      },
      [updateStatus, syncBoardToTonematrix],
    )

    const applyMoveWithPromotionChoice = useCallback(
      (from: string, to: string) => {
        const game = gameRef.current
        const color = game.turn()
        const id = "promotion-choice"
        showDialog({
          id,
          title: "Promotion",
          content: (
            <div
              className={`row small-gap promotion-choices promotion-choices-${color}`}
            >
              {PROMOTION_PIECES.map((piece) => (
                <button
                  key={piece}
                  className="promotion-choice hug"
                  onClick={() => {
                    closeDialog(id)
                    applyMove(from, to, piece)
                    if (
                      computerPlaysAs &&
                      gameRef.current.turn() === computerPlaysAs
                    ) {
                      setTimeout(
                        () => void makeAiMove(moveDelayMs),
                        moveDelayMs,
                      )
                    }
                  }}
                  title={
                    piece === "q"
                      ? "Queen"
                      : piece === "r"
                        ? "Rook"
                        : piece === "n"
                          ? "Knight"
                          : "Bishop"
                  }
                >
                  <span className="promotion-piece-icon">
                    <Icons.ChessPiece
                      piece={piece}
                      color={color}
                      size="1.75rem"
                    />
                  </span>
                </button>
              ))}
            </div>
          ),
          dismissible: true,
          closeOnBackdropClick: false,
        })
      },
      [
        showDialog,
        closeDialog,
        applyMove,
        computerPlaysAs,
        makeAiMove,
        moveDelayMs,
      ],
    )

    useImperativeHandle(ref, () => ({ restart }), [restart])

    useEffect(() => {
      updateStatus()
      setReady(true)
      return () => clearTimeout(timerRef.current)
    }, [updateStatus])

    useEffect(() => {
      if (!ready || !tonematrix) return
      if (!nexus) {
        setFenPatternsReady(true)
        return
      }

      if (lastSyncedDocumentRef.current !== nexus) {
        lastSyncedDocumentRef.current = nexus
        hasLoadedFromStoredRef.current = false
        setFenPatternsReady(false)
      }
      if (hasLoadedFromStoredRef.current) return

      const initFromStored = async () => {
        const storedFen = await getStoredFen(nexus)
        if (storedFen) {
          try {
            gameRef.current = new Chess(storedFen)
            setPosition(storedFen)
            setSelectedSquare(null)
            setLastMove(null)
            updateStatus()
          } catch (e) {
            console.error("Invalid stored FEN:", e)
          }
        }
        hasLoadedFromStoredRef.current = true
        await syncBoardToTonematrix()
        setFenPatternsReady(true)
      }

      void initFromStored()
    }, [ready, nexus, tonematrix, syncBoardToTonematrix, updateStatus])

    /** One scheduler for autoplay chain and for vs-computer kick-off (avoids losing the bot's turn when mode switches). */
    useEffect(() => {
      clearTimeout(timerRef.current)
      if (ready && autoPlay) {
        timerRef.current = setTimeout(
          () => void makeAiMove(moveDelayMs),
          moveDelayMs,
        )
      } else if (ready && computerPlaysAs) {
        const game = gameRef.current
        if (!game.isGameOver() && game.turn() === computerPlaysAs) {
          timerRef.current = setTimeout(
            () => void makeAiMove(moveDelayMs),
            moveDelayMs,
          )
        }
      }
      return () => clearTimeout(timerRef.current)
    }, [ready, autoPlay, computerPlaysAs, makeAiMove, moveDelayMs])

    const canInteract =
      !autoPlay &&
      (!computerPlaysAs || gameRef.current?.turn() !== computerPlaysAs) &&
      (!userPlaysAs || gameRef.current?.turn() === userPlaysAs)

    useEffect(() => {
      if (!canInteract) setSelectedSquare(null)
    }, [canInteract])

    const squareStyles = useMemo(() => {
      const styles: Record<string, React.CSSProperties> = {}

      // Last move highlight
      if (lastMove) {
        styles[lastMove.from] = {
          backgroundColor: chessLastMoveHighlight,
        }
        styles[lastMove.to] = {
          backgroundColor: chessLastMoveHighlight,
        }
      }

      // Selected square and legal moves
      if (selectedSquare && canInteract) {
        const game = gameRef.current
        const legalMoves = game.moves({
          square: selectedSquare as Square,
          verbose: true,
        }) as { from: string; to: string }[]

        styles[selectedSquare] = {
          backgroundColor: chessSelectedSquareHighlight,
        }
        for (const m of legalMoves) {
          styles[m.to] = {
            backgroundColor: chessLegalMoveHighlight,
          }
        }
      }
      return styles
    }, [lastMove, selectedSquare, canInteract])

    const canDragPiece = useCallback(
      ({ piece }: { piece: { pieceType: string } }) => {
        if (!canInteract) return false
        const pieceColor = piece.pieceType.startsWith("w") ? "w" : "b"
        return pieceColor === gameRef.current.turn()
      },
      [canInteract],
    )

    const handlePieceDrop = useCallback(
      ({
        sourceSquare,
        targetSquare,
      }: {
        sourceSquare: string
        targetSquare: string | null
      }) => {
        if (!targetSquare || sourceSquare === targetSquare || !canInteract)
          return false
        const pieceColor = gameRef.current.getPieceColorAt(sourceSquare)
        if (pieceColor !== gameRef.current.turn()) return false
        if (isPromotionMove(gameRef.current, sourceSquare, targetSquare)) {
          applyMoveWithPromotionChoice(sourceSquare, targetSquare)
          return false
        }
        return applyMove(sourceSquare, targetSquare)
      },
      [canInteract, applyMove, applyMoveWithPromotionChoice],
    )

    const handleSquareClick = useCallback(
      ({
        piece,
        square,
      }: {
        piece: { pieceType: string } | null
        square: string
      }) => {
        if (!canInteract) return

        const game = gameRef.current
        if (game.isGameOver()) return

        const legalMoves = game.moves({
          square: selectedSquare as Square,
          verbose: true,
        }) as { from: string; to: string }[]
        const moveToLegal = legalMoves.find((m) => m.to === square)

        if (moveToLegal && selectedSquare) {
          if (isPromotionMove(gameRef.current, selectedSquare, square)) {
            applyMoveWithPromotionChoice(selectedSquare, square)
          } else {
            applyMove(selectedSquare, square)
            if (computerPlaysAs && gameRef.current.turn() === computerPlaysAs) {
              setTimeout(() => void makeAiMove(moveDelayMs), moveDelayMs)
            }
          }
          return
        }

        setSelectedSquare(null)

        if (!piece) return
        const pieceColor = piece.pieceType.startsWith("w") ? "w" : "b"
        if (pieceColor !== game.turn()) return
        if (userPlaysAs && pieceColor !== userPlaysAs) return

        setSelectedSquare(square)
      },
      [
        canInteract,
        selectedSquare,
        computerPlaysAs,
        userPlaysAs,
        applyMove,
        applyMoveWithPromotionChoice,
        makeAiMove,
        moveDelayMs,
      ],
    )

    const boardOrientation: "white" | "black" =
      userPlaysAs === "b" ? "black" : "white"

    const chessboardOptions = useMemo(
      () => ({
        position,
        boardOrientation,
        allowDragging: canInteract,
        canDragPiece,
        onPieceDrop: handlePieceDrop,
        onSquareClick: handleSquareClick,
        squareStyles,
        darkSquareStyle: { backgroundColor: "var(--chess-board-bg-dark)" },
        lightSquareStyle: { backgroundColor: "var(--chess-board-bg-light)" },
        darkSquareNotationStyle: { color: "var(--chess-board-bg-light)" },
        lightSquareNotationStyle: { color: "var(--chess-board-bg-dark)" },
        showNotation: true,
        animationDurationInMs: 300,
      }),
      [
        position,
        boardOrientation,
        canInteract,
        canDragPiece,
        handlePieceDrop,
        handleSquareClick,
        squareStyles,
      ],
    )

    return (
      <div className="board-wrapper">
        <div className="board-container">
          <ReactChessboard options={chessboardOptions} />
        </div>
      </div>
    )
  },
)
