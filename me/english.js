export const COURSE_PREFIX = 'course/english/';

export const ENGLISH = [
  {
    title: 'Настоящее',
    lessons: [
      {
        slug: 'present-simple',
        title: 'Present Simple',
        summary: 'Привычки, факты и расписания.',
        notes: [
          ['Когда использовать', 'Для того, что происходит регулярно, верно вообще или стоит в расписании.', 'I train on Mondays. The gym opens at seven.'],
          ['Утверждение', 'После I, you, we и they используй начальную форму. После he, she или it обычно добавляй -s или -es.', 'I train every week. She trains every week.'],
          ['Вопрос и отрицание', 'Используй do или does. После does и doesn’t глагол возвращается в начальную форму.', 'Does he train here? He doesn’t train here.'],
        ],
        quiz: [
          ['She ___ to the gym on Fridays.', 'goes', 'go', 'is go', 'После she добавляем -es к go.'],
          ['___ they play tennis every week?', 'Do', 'Does', 'Are', 'Для they нужен do.'],
          ['He ___ coffee after dinner.', 'doesn’t drink', 'doesn’t drinks', 'don’t drink', 'После doesn’t нужна начальная форма drink.'],
          ['The train ___ at 8:30 every morning.', 'leaves', 'leave', 'is leave', 'Это расписание. The train соответствует it.'],
          ['Как сказать «Мы обычно готовим дома»?', 'We usually cook at home.', 'We usually cooks at home.', 'We are usually cook at home.', 'Обычное действие. После we используем cook.'],
        ],
      },
      {
        slug: 'present-continuous',
        title: 'Present Continuous',
        summary: 'Что происходит сейчас или временно.',
        notes: [
          ['Когда использовать', 'Для действия прямо сейчас и для временного занятия вокруг настоящего момента.', 'I’m reading now. I’m working from home this week.'],
          ['Как построить', 'Используй am, is или are и глагол с -ing. В вопросе поставь am, is или are перед подлежащим.', 'She is running. Is she running?'],
          ['Как выбрать между двумя временами', 'Если говоришь о привычке, используй Present Simple. Для процесса сейчас используй Present Continuous.', 'I walk to work every day. Today I’m taking the bus.'],
        ],
        quiz: [
          ['Listen! Someone ___ at the door.', 'is knocking', 'knock', 'are knocking', 'Действие происходит в момент речи. Someone требует is.'],
          ['They ___ dinner right now.', 'are cooking', 'is cooking', 'do cooking', 'После they в этой форме используется are.'],
          ['___ you studying right now?', 'Are', 'Do', 'Is', 'В вопросе ставим are перед you.'],
          ['Как сказать «Я каждое утро пью чай»?', 'I drink tea every morning.', 'I am drinking tea every morning.', 'I drinks tea every morning.', 'Каждое утро указывает на привычку.'],
          ['She usually drives, but today she ___ the bus.', 'is taking', 'are taking', 'is take', 'Временное исключение из привычки. She is taking.'],
        ],
      },
    ],
  },
  {
    title: 'Прошедшее',
    lessons: [
      {
        slug: 'past-simple',
        title: 'Past Simple',
        summary: 'Законченные события в прошлом.',
        notes: [
          ['Когда использовать', 'Для законченного действия в прошлом. Частые подсказки — yesterday, last week и two days ago.', 'We trained yesterday.'],
          ['Утверждение', 'У правильных глаголов обычно появляется -ed. У неправильных запоминай вторую форму.', 'I watched a film. We went home.'],
          ['Вопрос и отрицание', 'После did и didn’t ставь начальную форму. С was и were вопрос строится без did.', 'Did you go? I didn’t go. Were you there?'],
        ],
        quiz: [
          ['We ___ home late last night.', 'went', 'go', 'goed', 'Went — вторая форма go.'],
          ['Did she ___ the email yesterday?', 'send', 'sent', 'sends', 'После did нужна начальная форма send.'],
          ['He ___ the lesson last week.', 'didn’t finish', 'didn’t finished', 'doesn’t finish', 'Прошедшее выражает didn’t.'],
          ['Where ___ you yesterday?', 'were', 'was', 'did be', 'Прошедшая форма be для you — were.'],
          ['They ___ the film on Saturday.', 'watched', 'watch', 'did watched', 'У watch правильная форма прошедшего времени watched.'],
        ],
      },
      {
        slug: 'past-continuous',
        title: 'Past Continuous',
        summary: 'Что было в процессе в прошлом.',
        notes: [
          ['Когда использовать', 'Для процесса, который шёл в конкретный момент в прошлом.', 'At eight last night, I was studying.'],
          ['Как построить', 'Используй was или were и глагол с -ing. Для I, he, she и it нужна форма was.', 'They were talking. Was she listening?'],
          ['Два события', 'Past Continuous часто описывает фон, а Past Simple — событие, которое произошло на этом фоне.', 'We were walking home when it started to rain.'],
        ],
        quiz: [
          ['At 8 p.m. yesterday, I ___ dinner.', 'was cooking', 'were cooking', 'was cook', 'Для I используем was и форму cooking.'],
          ['While the children ___, it started to rain.', 'were playing', 'was playing', 'were play', 'Игра была в процессе, когда начался дождь.'],
          ['___ she studying when you called?', 'Was', 'Were', 'Did', 'В вопросе Was ставится перед she.'],
          ['I was reading when the phone ___.', 'rang', 'ring', 'were ringing', 'Одиночное событие на фоне чтения — Past Simple.'],
          ['At seven, we ___ yet. We were still at work.', 'weren’t training', 'wasn’t training', 'didn’t training', 'После we — weren’t и форма с -ing.'],
        ],
      },
    ],
  },
  {
    title: 'Связь с настоящим',
    lessons: [
      {
        slug: 'present-perfect',
        title: 'Present Perfect',
        summary: 'Опыт, результат сейчас и действие до настоящего момента.',
        notes: [
          ['Как построить', 'Используй have или has и третью форму глагола. Например, do → done, see → seen.', 'I have done it. She has seen that film.'],
          ['Когда использовать', 'Когда важен опыт до настоящего момента или результат сейчас. С since указывают начало, с for — длительность.', 'Have you ever tried yoga? I have lived here since 2020.'],
          ['Как отличить от Past Simple', 'Для завершённого периода вроде yesterday или last year выбирай Past Simple. Когда период продолжается, можно использовать Present Perfect.', 'I trained yesterday. I have trained twice this week.'],
        ],
        quiz: [
          ['Have you ever ___ sushi?', 'tried', 'try', 'trying', 'После have в этой форме нужна третья форма tried.'],
          ['She ___ already finished her work.', 'has', 'have', 'is', 'После she используется has.'],
          ['I ___ her yesterday.', 'saw', 'have seen', 'have saw', 'Yesterday обозначает законченный период.'],
          ['We have lived here ___ five years.', 'for', 'since', 'from', 'For используется с длительностью.'],
          ['He has worked here ___ May.', 'since', 'for', 'during', 'Since указывает на начальный момент.'],
        ],
      },
    ],
  },
  {
    title: 'Будущее',
    lessons: [
      {
        slug: 'future-plans',
        title: 'Will и Going to',
        summary: 'Решения в момент речи, намерения и прогнозы.',
        notes: [
          ['Will', 'Используй will и начальную форму для решений в момент разговора, предложений помощи и прогнозов, основанных на мнении.', 'The phone is ringing. I’ll answer it.'],
          ['Be going to', 'Используй am, is или are + going to + глагол для намерения, которое сформировалось раньше, и прогноза по видимым признакам.', 'Look at the clouds. It’s going to rain.'],
          ['Личная договорённость', 'Для уже согласованного плана с конкретным временем можно использовать Present Continuous.', 'I’m meeting Alex at six tomorrow.'],
        ],
        quiz: [
          ['«I can’t lift this box.» «I ___ help you.»', 'will', 'am going', 'do', 'Говорящий предлагает помощь в момент разговора.'],
          ['Look at him! He ___ fall.', 'is going to', 'are going to', 'is going', 'Есть видимые признаки. Для he используем is going to.'],
          ['We’ve already decided. We ___ start on Monday.', 'are going to', 'is going to', 'will to', 'Это заранее принятое решение.'],
          ['I think our team ___ win.', 'will', 'is', 'will to', 'Will подходит для прогноза, основанного на мнении.'],
          ['We’ve booked a table. We ___ Sam at seven.', 'are meeting', 'is meeting', 'are meet', 'Для конкретной договорённости подходит Present Continuous.'],
        ],
      },
    ],
  },
];

export function lessonSource(lesson) {
  return lesson.quiz.map(([prompt, correct, firstWrong, secondWrong, explanation]) =>
    `? ${prompt}\n+ ${correct}\n- ${firstWrong}\n- ${secondWrong}\n! ${explanation}`
  ).join('\n\n');
}
