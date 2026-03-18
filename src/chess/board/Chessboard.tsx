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
import { AudiotoolContext } from "../../context"
import {
  getStoredFen,
  updateTonematrixFromChessBoard,
} from "../../nexus/updateTonematrixFromChess"
import { useBpm } from "../../nexus/useBpm"
import { useFenSyncFromNexus } from "../../nexus/useFenSyncFromNexus"
import {
  chessLastMoveHighlight,
  chessLegalMoveHighlight,
  chessSelectedSquareHighlight,
} from "../../theme"
import type { ChessboardProps, ChessboardRef } from "../Chessboard"
import { Chess, type Square } from "../engine/chessAdapter"
import { getStockfishMove } from "../engine/chessApi"

const FEN_START =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

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
    const gameRef = useRef(new Chess())
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const autoPlayRef = useRef(autoPlay)
    const hasLoadedFromStoredRef = useRef(false)
    const lastSyncedDocumentRef = useRef<SyncedDocument | undefined>(undefined)

    const [position, setPosition] = useState(FEN_START)
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
      null,
    )
    const [ready, setReady] = useState(false)
    const [fenPatternsReady, setFenPatternsReady] = useState(false)

    const bpm = useBpm()
    const moveDelayMs = 60000 / bpm

    autoPlayRef.current = autoPlay

    const syncBoardToTonematrix = useCallback(() => {
      if (nexus) {
        return updateTonematrixFromChessBoard(
          nexus,
          gameRef.current.board(),
          gameRef.current.fen(),
        )
      }
      return Promise.resolve()
    }, [nexus])

    const whiteLabel = whitePlayerName
      ? `${whitePlayerName} (white)`
      : "White"
    const blackLabel = blackPlayerName
      ? `${blackPlayerName} (black)`
      : "Black"

    const updateStatus = useCallback(() => {
      const game = gameRef.current
      if (game.isCheckmate()) {
        onStatusChange(
          game.turn() === "w"
            ? `${blackLabel} wins by checkmate!`
            : `${whiteLabel} wins by checkmate!`,
        )
      } else if (game.isDraw()) {
        onStatusChange("Game drawn!")
      } else if (game.isStalemate()) {
        onStatusChange("Stalemate!")
      } else {
        onStatusChange(`${game.turn() === "w" ? whiteLabel : blackLabel} to move`)
      }
    }, [whiteLabel, blackLabel, onStatusChange])

    const applyMove = useCallback(
      (from: string, to: string) => {
        const game = gameRef.current
        const result = game.move({ from, to })
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
          timerRef.current = setTimeout(
            () => void makeAiMove(delayMs),
            delayMs,
          )
        }
      },
      [updateStatus, syncBoardToTonematrix],
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

    useEffect(() => {
      if (ready && autoPlay) {
        timerRef.current = setTimeout(
          () => void makeAiMove(moveDelayMs),
          moveDelayMs,
        )
      } else {
        clearTimeout(timerRef.current)
      }
      return () => clearTimeout(timerRef.current)
    }, [ready, autoPlay, makeAiMove, moveDelayMs])

    useEffect(() => {
      if (!ready || !computerPlaysAs || autoPlay) return
      const game = gameRef.current
      if (game.isGameOver()) return
      if (game.turn() === computerPlaysAs) {
        const t = setTimeout(() => void makeAiMove(moveDelayMs), moveDelayMs)
        return () => clearTimeout(t)
      }
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

    const handlePieceDrop = useCallback(
      ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
        if (!targetSquare || !canInteract) return false
        return applyMove(sourceSquare, targetSquare)
      },
      [canInteract, applyMove],
    )

    const handleSquareClick = useCallback(
      ({ piece, square }: { piece: { pieceType: string } | null; square: string }) => {
        if (!canInteract) return

        const game = gameRef.current
        if (game.isGameOver()) return

        const legalMoves = game.moves({
          square: selectedSquare as Square,
          verbose: true,
        }) as { from: string; to: string }[]
        const moveToLegal = legalMoves.find((m) => m.to === square)

        if (moveToLegal && selectedSquare) {
          applyMove(selectedSquare, square)
          if (computerPlaysAs && gameRef.current.turn() === computerPlaysAs) {
            setTimeout(() => void makeAiMove(moveDelayMs), moveDelayMs)
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
