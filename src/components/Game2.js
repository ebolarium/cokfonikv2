import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  Paper,
  LinearProgress,
  Switch,
  FormControlLabel
} from "@mui/material";
import Soundfont from "soundfont-player";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

const level1Notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
const level2Notes = [
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4",
  "G4", "G#4", "A4", "A#4", "B4"
];
const level3Notes = [
  "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3",
  "G3", "G#3", "A3", "A#3", "B3",
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4",
  "G4", "G#4", "A4", "A#4", "B4"
];

const noteNames = {
  "C3": "Do₃", "C#3": "Do#₃", "D3": "Re₃", "D#3": "Mi♭₃", "E3": "Mi₃",
  "F3": "Fa₃", "F#3": "Fa#₃", "G3": "Sol₃", "G#3": "Sol#₃", "A3": "La₃",
  "A#3": "Si♭₃", "B3": "Si₃",
  "C4": "Do₄", "C#4": "Do#₄", "D4": "Re₄", "D#4": "Mi♭₄", "E4": "Mi₄",
  "F4": "Fa₄", "F#4": "Fa#₄", "G4": "Sol₄", "G#4": "Sol#₄", "A4": "La₄",
  "A#4": "Si♭₄", "B4": "Si₄"
};

const LEVEL_THRESHOLDS = {
  2: 50,
  3: 90
};

const getNotesForLevel = (lvl) => {
  switch (lvl) {
    case 1:
      return level1Notes;
    case 2:
      return level2Notes;
    case 3:
      return level3Notes;
    default:
      return level1Notes;
  }
};

const IntervalGame = () => {
  const [audioCtx, setAudioCtx] = useState(null);
  const [piano, setPiano] = useState(null);
  const [currentNote, setCurrentNote] = useState("C4");
  const [targetNote, setTargetNote] = useState(null);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [topScores, setTopScores] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openScoreboard, setOpenScoreboard] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [mode, setMode] = useState("game");

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // AudioContext ve Piyano yükleme
  useEffect(() => {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    Soundfont.instrument(ac, "acoustic_grand_piano").then((p) => {
      setPiano(p);
    });
    setAudioCtx(ac);
  }, []);

  const generateRandomNote = (overrideLevel) => {
    const usedLevel = overrideLevel ?? level;
    const currentNotes = getNotesForLevel(usedLevel);

    let randomNote;
    do {
      randomNote = currentNotes[Math.floor(Math.random() * currentNotes.length)];
    } while (randomNote === targetNote);
    //console.log('Selected note:', randomNote);


    setTargetNote(randomNote);
    setHasAnswered(false);
  };

  const playInterval = () => {
    if (!piano || !targetNote) return;
    setMessage("");
    setIsPlaying(true);

    piano.play(currentNote, 0, { duration: 1 });
    setTimeout(() => {
      piano.play(targetNote, 0, { duration: 1 });
    }, 1000);

    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  useEffect(() => {
    if (gameActive && targetNote) {
      playInterval();
    }
  }, [targetNote, gameActive]);

  const getNextLevelThreshold = () => {
    if (level === 1) return LEVEL_THRESHOLDS[2];
    if (level === 2) return LEVEL_THRESHOLDS[3];
    return null;
  };

  const calculateBonus = () => {
    return Math.floor(streak / 3);
  };

  const checkAnswer = (guess) => {
    if (!gameActive || isPlaying || hasAnswered) return;
    setHasAnswered(true);

    if (guess === targetNote) {
      const bonus = calculateBonus();
      const pointsEarned = 5 + bonus;
      setStreak((prev) => prev + 1);

      setMessage(
        `Doğru! ${
          bonus > 0
            ? `+${pointsEarned} puan (${bonus} bonus)`
            : "+5 puan"
        } 🎉`
      );

      setScore((prev) => {
        const newScore = prev + pointsEarned;

        if (newScore >= LEVEL_THRESHOLDS[3] && level === 2) {
          setLevel(3);
          setMessage("Muhteşem! Level 3'e yükseldiniz! 🎉🌟");
        } else if (newScore >= LEVEL_THRESHOLDS[2] && level === 1) {
          setLevel(2);
          setMessage("Tebrikler! Level 2'ye yükseldiniz! 🎉");
        }
        return newScore;
      });

      setTimeout(() => {
        generateRandomNote();
      }, 1000);
    } else {
      if (mode === "game") {
        setMessage("Yanlış! ❌");
      } else {
        setMessage(`Yanlış! (Doğru cevap: ${noteNames[targetNote]}) ❌`);
      }
      setStreak(0);

      if (mode === "game") {
        setLives((prevLives) => {
          const newLives = prevLives - 1;
          if (newLives > 0) {
            setTimeout(() => {
              playInterval();
              setHasAnswered(false);
            }, 1000);
          } else {
            endGame();
          }
          return newLives;
        });
      } else {
        setTimeout(() => {
          playInterval();
          setHasAnswered(false);
        }, 1000);
      }
    }
  };

  const fetchTopScores = async () => {
    if (mode === "practice") return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/scores/top/oyun2`);
      const data = await response.json();
      setTopScores(data);
    } catch (error) {
      console.error("En yüksek skorlar yüklenemedi:", error);
    }
  };

  const saveScore = useCallback(async () => {
    if (mode === "practice") return;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, game: "oyun2", score }),
      });
      if (response.ok) {
        fetchTopScores();
      }
    } catch (error) {
      console.error("Skor API isteğinde hata:", error);
    }
  }, [score, mode]);

  useEffect(() => {
    fetchTopScores();
  }, [mode]);

  const startGame = () => {
    if (!piano) {
      setMessage("Piano yükleniyor, lütfen biraz bekleyin...");
      return;
    }
    // Tarayıcı suspend ederse, burada resume edelim:
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch((err) => console.warn(err));
    }

    setLevel(1);
    setScore(0);
    setLives(mode === "game" ? 3 : Infinity);
    setStreak(0);
    setMessage("");
    setGameActive(true);
    setHasAnswered(false);

    setCurrentNote("C4");
    generateRandomNote(1);
  };

  const endGame = () => {
    setGameActive(false);
    saveScore();
    setOpenModal(true);
  };

  const handleModeChange = (event) => {
    const newMode = event.target.checked ? "practice" : "game";
    setMode(newMode);
    setLives(newMode === "practice" ? Infinity : 3);
    setScore(0);
    setLevel(1);
    setStreak(0);
    setMessage("");
    setGameActive(false);
    setHasAnswered(false);
    setTargetNote(null);
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      bgcolor="#f9f9f9"
      padding="20px"
      marginTop="0px"
    >
      {/* Üst Kısım: Başlık & Mod Değiştirme */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        maxWidth="400px"
        mb={3}
      >
        <Typography
          variant="h4"
          gutterBottom={false}
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          Aralık Oyunu
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={mode === "practice"}
              onChange={handleModeChange}
              color="primary"
            />
          }
          label={mode === "game" ? "Oyun" : "Pratik"}
          labelPlacement="start"
          sx={{ marginLeft: "10px", fontFamily: "'Press Start 2P', cursive" }}
        />
      </Box>

      {/* Level Bilgisi */}
      <Typography
        variant="h5"
        color="primary"
        style={{ fontFamily: "'Press Start 2P', cursive" }}
        mb={3}
      >
        Level {level}
      </Typography>

      {/* Level / Puan / Progress */}
      <Box width="100%" maxWidth="400px" mb={2}>
        <Typography variant="subtitle1" textAlign="center" mb={1}>
          {level === 1 && "Temel Notalar"}
          {level === 2 && "Diyez/Bemol Notalar"}
          {level === 3 && "İki Oktav"}
        </Typography>

        {getNextLevelThreshold() && (
          <>
            <Typography variant="caption" display="block" textAlign="center" mb={1}>
              Level {level + 1}'e: {getNextLevelThreshold() - score} puan kaldı
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(score / getNextLevelThreshold()) * 100}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </>
        )}
      </Box>

      {/* Canlar ve Skor */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        maxWidth="400px"
        mb={2}
      >
        <Box display="flex" alignItems="center">
          {mode === "game" &&
            [1, 2, 3].map((heart) => (
              <Box key={heart} mr={1}>
                {lives >= heart ? (
                  <FavoriteIcon color="error" />
                ) : (
                  <FavoriteBorderIcon color="error" />
                )}
              </Box>
            ))}
          {mode === "practice" && <FavoriteIcon color="error" />}
        </Box>
        <Box textAlign="right">
          <Typography variant="h6">Skor: {score}</Typography>
          {streak > 0 && (
            <Typography variant="caption" color="success.main">
              Seri: {streak} 🔥
            </Typography>
          )}
        </Box>
      </Box>

      {/* Başlat & Skorboard Butonları */}
      <Box
        display="flex"
        justifyContent="center"
        gap="10px"
        mb={2}
        width="100%"
        maxWidth="400px"
      >
        {mode === "game" && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setOpenScoreboard(true)}
            fullWidth
          >
            Skorboard
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            startGame();
            setOpenModal(false);
          }}
          disabled={gameActive}
          fullWidth
        >
          {gameActive ? "Oyun Devam Ediyor" : "Başla"}
        </Button>
      </Box>

      {/* Soru Metni */}
      <Typography variant="subtitle1" textAlign="center" mb={2}>
        Çalan ilk nota {noteNames[currentNote]}. İkinci nota nedir?
      </Typography>

      {/* Cevap Butonları */}
      <Box
        display="flex"
        justifyContent="center"
        flexWrap="wrap"
        mb={2}
        maxWidth="600px"
        width="100%"
      >
        {getNotesForLevel(level).map((n) => (
          <Button
            key={n}
            variant="contained"
            color={
              level === 1
                ? "primary"
                : level === 2
                ? "secondary"
                : "success"
            }
            size="small"
            sx={{
              margin: "4px",
              flex:
                level === 3
                  ? "1 1 calc(25% - 8px)"
                  : "1 1 calc(33.333% - 8px)",
              minWidth: "60px",
              maxWidth: "100px",
              padding: "6px 12px",
              fontSize: "0.75rem"
            }}
            onClick={() => checkAnswer(n)}
            disabled={!gameActive || isPlaying || hasAnswered}
          >
            {noteNames[n]}
          </Button>
        ))}
      </Box>

      {/* Durum Mesajı */}
      <Typography
        variant="h6"
        color={message.includes("Doğru") ? "success.main" : "error.main"}
        textAlign="center"
        mb={2}
      >
        {message}
      </Typography>

      {/* Game Over Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "20px",
            maxWidth: "90%",
            width: "400px",
            textAlign: "center"
          }}
        >
          <Typography variant="h5" gutterBottom>
            Oyun Bitti!
          </Typography>
          <Typography variant="h6" gutterBottom>
            Skorunuz: {score}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Ulaşılan Level: {level}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: "20px" }}
            onClick={() => {
              startGame();
              setOpenModal(false);
            }}
          >
            Tekrar Oyna
          </Button>
        </Paper>
      </Modal>

      {/* Skorboard Modal */}
      <Modal open={openScoreboard} onClose={() => setOpenScoreboard(false)}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "20px",
            maxWidth: "90%",
            width: "400px",
            textAlign: "center",
            maxHeight: "80vh",
            overflowY: "auto"
          }}
        >
          <Typography variant="h5" gutterBottom>
            Skorboard
          </Typography>
          {topScores.length > 0 ? (
            <Box>
              {topScores.map((entry, index) => (
                <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                  {index + 1}. {entry.user?.name || "-"}{" "}
                  {entry.user?.surname || "-"}: {entry.maxScore || "-"}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body1">
              Henüz bir skor bulunmuyor.
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: "20px" }}
            onClick={() => setOpenScoreboard(false)}
          >
            Kapat
          </Button>
        </Paper>
      </Modal>
    </Box>
  );
};

export default IntervalGame;
