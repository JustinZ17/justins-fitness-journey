/**
 * Short how-to for each exercise.
 *
 * Keyed by normalised name rather than exercise id, so a guide attaches itself
 * whether the exercise came from the seed data, a coach's plan imported as a
 * backup, or something typed in at the gym. Ids differ between those; names
 * don't.
 *
 * Written for a beginner: what to set up, what the rep feels like, the one
 * mistake almost everyone makes, and how to recognise the kit. Deliberately
 * short — this gets read standing next to a machine, not on the sofa.
 */

/** 'Seated row (High)' -> 'seated row' */
export function guideKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop qualifiers like "(High)"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const g = (art, find, setup, execute, mistake) => ({ art, find, setup, execute, mistake })

export const GUIDES = {
  'leg press': g(
    'legPress',
    'A big angled sled you sit under, with a footplate above you and weight plates or a stack on the side. Usually against a wall in the machines area.',
    'Sit right back so your whole spine touches the pad. Feet flat on the plate, about shoulder-width, toes turned out slightly. Release the safety handles at the sides.',
    'Lower the plate until your knees reach roughly 90°, then press through your whole foot until your legs are almost straight.',
    "Don't lock your knees hard at the top, and don't let your lower back round off the pad at the bottom — that's the sign you've gone too deep."
  ),

  'seated row': g(
    'seatedRow',
    'A cable stack you sit facing, with a chest pad or foot plate and a handle on a cable. "High" means the cable is set above chest height.',
    'Chest against the pad or feet braced. Sit tall, arms straight, shoulders relaxed forward at the start.',
    'Pull the handle toward your upper chest, leading with your elbows and squeezing your shoulder blades together. Return under control until your arms are straight again.',
    "Don't heave with your lower back. If your torso is rocking to move the weight, it's too heavy."
  ),

  'chest press': g(
    'chestPress',
    'A seated machine with two handles at chest height that push away from you. Often next to the shoulder press machine.',
    'Adjust the seat so the handles sit level with the middle of your chest. Back flat against the pad, feet planted.',
    'Press the handles away until your arms are almost straight, then let them come back until your hands are level with your chest.',
    "Don't flare your elbows straight out to the sides — keep them at roughly 45° from your body to keep your shoulders happy."
  ),

  'lateral raise': g(
    'lateralRaise',
    'Just a pair of light dumbbells. Lighter than you think — this is a small muscle.',
    'Stand tall, dumbbells at your sides, a slight bend in the elbows that you keep the whole time.',
    'Raise both arms out to the sides until they reach shoulder height, then lower slowly. Lead with your elbows, not your hands.',
    'Going too heavy and swinging. If you have to lean back to start the rep, halve the weight — it is normal for this to be your lightest exercise by far.'
  ),

  'bicep curl': g(
    'bicepCurl',
    'Dumbbells, or a cable with a straight bar attachment.',
    'Stand tall, arms hanging straight, palms facing forward. Elbows tucked against your ribs.',
    'Curl the weight up to shoulder height keeping your elbows pinned in place, then lower all the way down until your arms are straight.',
    "Letting your elbows drift forward and swinging your hips. If your body moves, the biceps aren't doing the work."
  ),

  'hammer curl': g(
    'bicepCurl',
    'A pair of dumbbells — the same ones you curl with, from the rack.',
    'Same as a curl but palms face each other, thumbs up, like holding two hammers.',
    'Curl up keeping the palms facing in the whole way, then lower under control.',
    'Same as the standard curl: keep the elbows still and let the arm do the work.'
  ),

  'tricep pushdown': g(
    'pushdown',
    'A cable stack with the pulley set high, using a straight bar or rope handle.',
    'Face the stack, grab the bar at about chest height, elbows tucked at your sides, a small forward lean.',
    'Push the bar down until your arms are fully straight, pause for a beat, then let it return to chest height.',
    'Letting the elbows travel forward and turning it into a whole-body push. Only the forearms should move.'
  ),

  'overhead tricep extension': g(
    'overheadExtension',
    'One dumbbell held in both hands, or a rope on a low cable.',
    'Hold the weight straight above your head with both hands, elbows pointing forward and close to your ears.',
    'Lower the weight behind your head by bending only at the elbows, then extend back up.',
    'Elbows flaring wide. Keep them pointing forward and close together.'
  ),

  'dumbbell bench press': g(
    'benchPress',
    'A flat bench and two dumbbells.',
    'Sit on the bench with the dumbbells on your thighs, then lie back and let the momentum bring them to your chest. Feet flat on the floor.',
    'Press both dumbbells up until your arms are almost straight, then lower until your hands are level with your chest.',
    "Elbows flared out at 90° to your body. Tuck them to about 45° — it's stronger and much kinder to your shoulders."
  ),

  'incline dumbbell press': g(
    'benchPress',
    'An adjustable bench set to roughly 30–45°, and two dumbbells.',
    'Set the bench to about 30°. Steeper than that turns it into a shoulder exercise.',
    'Same as a bench press: lower to the upper chest, press up until nearly straight.',
    "Setting the bench too upright, and bouncing the weights off your chest."
  ),

  'dumbbell shoulder press': g(
    'shoulderPress',
    'Two dumbbells and, ideally, a bench with an upright back support.',
    'Sit tall with back supported. Start with the dumbbells at shoulder height, palms facing forward.',
    'Press straight up until your arms are almost straight overhead, then lower back to shoulder height under control.',
    'Arching your lower back to help the weight up. Squeeze your glutes and keep your ribs down.'
  ),

  'one arm dumbbell row': g(
    'dumbbellRow',
    'One dumbbell and a flat bench.',
    'Put one knee and the same-side hand on the bench, other foot on the floor, back flat and roughly parallel to the ground.',
    'Pull the dumbbell up toward your hip, elbow close to your body, then lower until the arm is straight. Do all reps on one side, then swap.',
    "Rotating your torso to yank the weight up, and pulling to the chest instead of the hip."
  ),

  'dumbbell pullover': g(
    'pullover',
    'One dumbbell and a flat bench.',
    'Lie on the bench, hold one dumbbell over your chest with both hands cupped under the top end, slight bend in the elbows.',
    'Lower the weight back behind your head until you feel a stretch across your chest and lats, then pull it back over your chest.',
    'Going too deep too soon. Only go as far as a comfortable stretch allows.'
  ),

  'rear delt fly': g(
    'rearDeltFly',
    'Two light dumbbells, or the pec deck machine set to run backwards.',
    'Hinge forward at the hips so your chest points at the floor, arms hanging straight down, slight elbow bend.',
    'Raise both arms out to the sides, squeezing the shoulder blades, then lower slowly.',
    'Way too heavy. This is a small muscle — treat it like the lateral raise.'
  ),

  'goblet squat': g(
    'gobletSquat',
    'One dumbbell or kettlebell.',
    'Hold one dumbbell vertically against your chest, both hands cupping the top. Feet a bit wider than shoulders, toes slightly out.',
    'Sit straight down between your feet, keeping your chest up and the weight against your chest, then drive back up through your heels.',
    'Letting the chest collapse forward. The dumbbell at your chest is a counterweight — let it help you stay upright.'
  ),

  'dumbbell romanian deadlift': g(
    'rdl',
    'Two dumbbells and enough floor space to stand clear of the rack.',
    'Stand tall holding the dumbbells in front of your thighs, feet hip-width, knees softly bent and staying that way.',
    'Push your hips backwards and let the dumbbells slide down the front of your legs until you feel a stretch in your hamstrings, then drive the hips forward to stand up.',
    "Turning it into a squat. The knees barely move — this is a hip hinge, and the weights stay close to your legs the whole way."
  ),

  'dumbbell lunge': g(
    'lunge',
    'Two dumbbells and a clear stretch of floor.',
    'Stand tall with a dumbbell in each hand at your sides.',
    'Step forward into a lunge until both knees are at about 90°, then push back to standing. Alternate legs, or do all reps on one side.',
    'Letting the front knee cave inwards, and leaning too far forward. Keep the torso upright.'
  ),

  'dumbbell calf raise': g(
    'calfRaise',
    'A dumbbell, ideally with a step or plate to stand the balls of your feet on.',
    'Stand with the balls of your feet on the edge of a step, heels hanging off, dumbbell in one hand.',
    'Rise up as high onto your toes as you can, hold for a beat, then lower your heels below the step for a stretch.',
    'Bouncing quickly through short reps. Slow down and use the full range.'
  ),

  'dumbbell glute bridge': g(
    'gluteBridge',
    'One dumbbell, on a mat.',
    'Lie on your back, knees bent, feet flat and close to your backside. Rest a dumbbell across your hips, held with both hands.',
    'Drive through your heels to lift your hips until your body is a straight line from knees to shoulders, squeeze at the top, then lower.',
    'Arching your lower back at the top instead of squeezing the glutes. Ribs down, squeeze, and stop when your body is level.'
  ),

  atw: g(
    'shoulderCircles',
    'Nothing, or very light plates. This is a warm-up.',
    'Stand tall with arms out in front of you.',
    'Sweep your arms in a wide circle — "around the world" — through overhead and back down, keeping them long. Move smoothly and stay in a comfortable range.',
    "Treating it as a lifting set. It's there to warm the shoulders up before the working sets, so keep it light."
  ),
}

/**
 * The same movement under another name. Coaches, gyms and equipment makers all
 * label things differently, and a near-miss silently means no guide at all —
 * so the common variants are mapped rather than left to chance.
 */
const ALIASES = {
  'dumbbell curl': 'bicep curl',
  'db curl': 'bicep curl',
  'barbell curl': 'bicep curl',
  'biceps curl': 'bicep curl',
  'triceps pushdown': 'tricep pushdown',
  'cable pushdown': 'tricep pushdown',
  'rope pushdown': 'tricep pushdown',
  'overhead triceps extension': 'overhead tricep extension',
  'tricep extension': 'overhead tricep extension',
  'lat raise': 'lateral raise',
  'side raise': 'lateral raise',
  'dumbbell lateral raise': 'lateral raise',
  'seated cable row': 'seated row',
  'cable row': 'seated row',
  'machine row': 'seated row',
  'leg press machine': 'leg press',
  'chest press machine': 'chest press',
  'machine chest press': 'chest press',
  'romanian deadlift': 'dumbbell romanian deadlift',
  rdl: 'dumbbell romanian deadlift',
  'dumbbell rdl': 'dumbbell romanian deadlift',
  'dumbbell row': 'one arm dumbbell row',
  'single arm dumbbell row': 'one arm dumbbell row',
  'bench press': 'dumbbell bench press',
  'incline press': 'incline dumbbell press',
  'shoulder press': 'dumbbell shoulder press',
  'overhead press': 'dumbbell shoulder press',
  'calf raise': 'dumbbell calf raise',
  'glute bridge': 'dumbbell glute bridge',
  'hip thrust': 'dumbbell glute bridge',
  lunge: 'dumbbell lunge',
  'walking lunge': 'dumbbell lunge',
  'reverse fly': 'rear delt fly',
  'rear delt raise': 'rear delt fly',
  'around the world': 'atw',
  'around the worlds': 'atw',
}

/** Guide for an exercise name, or null when we don't have one written. */
export function guideFor(name) {
  const key = guideKey(name)
  return GUIDES[key] ?? GUIDES[ALIASES[key]] ?? null
}
