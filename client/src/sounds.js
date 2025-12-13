export const playSuccessSound = () => {
    // Son "Pop" léger
    const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
    audio.volume = 0.5; // Pas trop fort
    audio.play();
};